use anyhow::{bail, Result};
use std::ffi::OsString;
use std::os::windows::ffi::OsStringExt;
use std::path::PathBuf;

use std::ptr;

use winapi::shared::minwindef::UINT;
use winapi::um::shellapi::{DragQueryFileW, HDROP};
use winapi::um::winuser::{CloseClipboard, GetClipboardData, IsClipboardFormatAvailable, OpenClipboard, CF_HDROP};

/// RAII guard to ensure clipboard is closed on drop
struct ClipboardGuard;
impl Drop for ClipboardGuard {
    fn drop(&mut self) {
        // best-effort close; ignore errors in Drop
        unsafe { let _ = CloseClipboard(); }
    }
}

/// Returns vector of PathBufs that were copied into the clipboard (CF_HDROP).
pub fn get_clipboard_file_list() -> Result<Vec<PathBuf>> {
    // fast check
    unsafe {
        if IsClipboardFormatAvailable(CF_HDROP) == 0 {
            return Ok(Vec::new());
        }
    }

    // open clipboard
    unsafe {
        if OpenClipboard(ptr::null_mut()) == 0 {
            bail!("OpenClipboard failed");
        }
    }
    let _guard = ClipboardGuard;

    // Get clipboard HDROP handle
    let hdrop = unsafe { GetClipboardData(CF_HDROP) as HDROP };
    if hdrop.is_null() {
        return Ok(Vec::new());
    }

    // Get number of files
    let count = unsafe { DragQueryFileW(hdrop, 0xFFFFFFFFu32, ptr::null_mut(), 0) };
    if count == 0 {
        // no files (or error). Return empty vector rather than error.
        return Ok(Vec::new());
    }

    let mut out = Vec::<PathBuf>::with_capacity(count as usize);

    for idx in 0..count {
        // ask required length (without trailing null)
        let required_len = unsafe { DragQueryFileW(hdrop, idx, ptr::null_mut(), 0) };
        if required_len == 0 {
            // skip this entry on unexpected error
            continue;
        }

        // allocate buffer with room for null terminator
        let mut buf: Vec<u16> = vec![0u16; (required_len + 1) as usize];

        let got = unsafe {
            DragQueryFileW(
                hdrop,
                idx,
                buf.as_mut_ptr(),
                (required_len + 1) as UINT,
            )
        };
        if got == 0 {
            // skip on failure
            continue;
        }

        // truncate to actual length (required_len) — ignore the trailing null
        buf.truncate(required_len as usize);

        let os = OsString::from_wide(&buf);
        out.push(PathBuf::from(os));
    }

    Ok(out)
}

/// Tauri command wrapper returning Vec<String> (paths as UTF-8 Strings)
#[tauri::command]
pub fn get_clipboard_files_command() -> Result<Vec<String>, String> {
    match get_clipboard_file_list() {
        Ok(paths) => {
            let mut out = Vec::with_capacity(paths.len());
            for p in paths {
                match p.into_os_string().into_string() {
                    Ok(s) => out.push(s),
                    Err(os) => {
                        // fallback: convert lossily
                        out.push(os.to_string_lossy().into_owned());
                    }
                }
            }
            Ok(out)
        }
        Err(e) => Err(format!("Failed to read clipboard CF_HDROP: {}", e)),
    }
}
