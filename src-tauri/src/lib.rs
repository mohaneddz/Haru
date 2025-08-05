#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::path::{Path, PathBuf};
use std::{fs, io};
use std::process::{Command, Child};
use once_cell::sync::OnceCell;
use std::sync::Mutex;

static VOICE_PROCESS: OnceCell<Mutex<Option<Child>>> = OnceCell::new();
static LLM_PROCESS: OnceCell<Mutex<Option<Child>>> = OnceCell::new();
static APP_PROCESS: OnceCell<Mutex<Option<Child>>> = OnceCell::new();

// --- NEW HELPER FUNCTION ---
/// Checks if a child process is still running. If it has exited,
/// this function cleans up the handle by setting it to None.
///
/// Returns `true` if the process is still running, `false` otherwise.
fn cleanup_finished_process(child_opt: &mut Option<Child>) -> bool {
    if let Some(child) = child_opt {
        match child.try_wait() {
            Ok(Some(_)) => { // Process has exited
                *child_opt = None; // Remove the handle
                return false; // It's not running
            },
            Ok(None) => { // Process is still running
                return true;
            },
            Err(_) => { // Error checking status, assume it's dead for safety
                *child_opt = None;
                return false;
            }
        }
    }
    false // It's not running if it was None to begin with
}

#[tauri::command]
fn read_image(path: String) -> Result<String, String> {
    use std::fs;
    use base64::{engine::general_purpose, Engine as _};

    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    let encoded = general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:image/png;base64,{}", encoded))
}

#[tauri::command]
fn read_dir_recursive(path: String, depth: Option<u32>) -> Result<Vec<String>, String> {
    fn walk_dir(dir: PathBuf, acc: &mut Vec<String>, depth: Option<u32>) -> io::Result<()> {
        if let Some(d) = depth {
            if d == 0 {
                return Ok(());
            }
        }
        acc.push(format!("{}/", dir.to_string_lossy()));
        for entry in fs::read_dir(&dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                let next_depth = depth.map(|d| d - 1);
                walk_dir(path, acc, next_depth)?;
            } else {
                acc.push(path.to_string_lossy().to_string());
            }
        }
        Ok(())
    }
    let mut result = Vec::new();
    walk_dir(PathBuf::from(path.clone()), &mut result, depth).map_err(|e| e.to_string())?;
    Ok(result)
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_file(dir: String) -> Result<String, String> {
    let base_name = "New Note";
    let ext = ".md";
    let mut count = 0;
    loop {
        let name = if count == 0 {
            format!("{}{}", base_name, ext)
        } else {
            format!("{} ({}){}", base_name, count, ext)
        };
        let full_path = Path::new(&dir).join(&name);
        if !full_path.exists() {
            fs::write(&full_path, "").map_err(|e| e.to_string())?;
            return Ok(full_path.to_string_lossy().to_string());
        }
        count += 1;
    }
}

#[tauri::command]
fn save_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_folder(dir: String) -> Result<String, String> {
    let base_name = "New Folder";
    let mut count = 0;
    loop {
        let name = if count == 0 {
            base_name.to_string()
        } else {
            format!("{} ({})", base_name, count)
        };
        let full_path = Path::new(&dir).join(&name);
        if !full_path.exists() {
            fs::create_dir_all(&full_path).map_err(|e| e.to_string())?;
            return Ok(full_path.to_string_lossy().to_string());
        }
        count += 1;
    }
}

#[tauri::command]
fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_path(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if p.is_dir() {
        fs::remove_dir_all(&p).map_err(|e| e.to_string())
    } else {
        fs::remove_file(&p).map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn move_path(source: String, destination: String) -> Result<(), String> {
    fs::rename(&source, &destination).map_err(|e| e.to_string())
}

#[tauri::command]
fn run_fasttext() -> Result<String, String> {
    let output = Command::new("D:\\Programming\\Projects\\Tauri\\haru\\models\\fasttext.exe")
        .args([
            "predict",
            "D:\\Programming\\Projects\\Tauri\\haru\\models\\model.bin",
            "D:\\Programming\\Projects\\Tauri\\haru\\models\\input.txt",
        ])
        .output()
        .map_err(|e| format!("Failed to execute: {}", e))?;

    if !output.status.success() {
        return Err(format!("FastText failed: {}", String::from_utf8_lossy(&output.stderr)));
    }
    let result = String::from_utf8(output.stdout).map_err(|e| format!("Invalid UTF-8 in output: {}", e))?;
    Ok(result.trim().to_string())
}

#[tauri::command]
fn run_app() -> Result<String, String> {
    let mut app_process = APP_PROCESS.get_or_init(|| Mutex::new(None)).lock().unwrap();
    // Use the helper to check if the process is truly running
    if cleanup_finished_process(&mut app_process) {
        return Err("⚠️ App client is already running.".into());
    }
    let child = Command::new("C:\\Users\\Mohaned\\miniconda3\\envs\\haru\\python.exe")
        .arg("D:\\Programming\\Projects\\Tauri\\haru\\backend\\app.py")
        .current_dir("D:\\Programming\\Projects\\Tauri\\haru\\backend")
        .spawn()
        .map_err(|e| format!("❌ Failed to start app.py: {}", e))?;
    app_process.replace(child);
    Ok("✅ App client started.".into())
}

#[tauri::command]
fn run_voice() -> Result<String, String> {
    let mut voice_process = VOICE_PROCESS.get_or_init(|| Mutex::new(None)).lock().unwrap();
    // Use the helper to check if the process is truly running
    if cleanup_finished_process(&mut voice_process) {
        return Err("⚠️ Voice client is already running.".into());
    }
    let child = Command::new("C:\\Users\\Mohaned\\miniconda3\\envs\\haru\\python.exe")
        .arg("D:\\Programming\\Projects\\Tauri\\haru\\models\\voice.py")
        .current_dir("D:\\Programming\\Projects\\Tauri\\haru\\models")
        .spawn()
        .map_err(|e| format!("❌ Failed to start voice.py: {}", e))?;
    voice_process.replace(child);
    Ok("✅ Voice client started.".into())
}

#[tauri::command]
fn run_llm() -> Result<String, String> {
    let mut llm_process = LLM_PROCESS.get_or_init(|| Mutex::new(None)).lock().unwrap();
    // Use the helper to check if the process is truly running
    if cleanup_finished_process(&mut llm_process) {
        return Err("⚠️ LLM client is already running.".into());
    }
    let child = Command::new("D:\\Programming\\Projects\\Tauri\\haru\\backend\\lib\\llama-server.exe")
        .arg("-m").arg("D:\\Programming\\Projects\\Tauri\\haru\\backend\\models\\gemma-3-4b-it-q4_0.gguf")
        .arg("-ngl").arg("99")
        .arg("-c").arg("8192")
        .arg("-t").arg("6")
        .current_dir("D:\\Programming\\Projects\\Tauri\\haru\\backend")
        .spawn()
        .map_err(|e| format!("❌ Failed to start llama-server: {}", e))?;
    llm_process.replace(child);
    Ok("✅ LLM client started.".into())
}

#[tauri::command]
fn stop_voice() -> Result<String, String> {
    if let Some(mut child) = VOICE_PROCESS.get_or_init(|| Mutex::new(None)).lock().unwrap().take() {
        match child.kill() {
            Ok(_) => Ok("🛑 Voice client stopped.".into()),
            Err(e) => Err(format!("❌ Failed to stop voice.py: {}", e)),
        }
    } else {
        Err("⚠️ No voice client is currently running.".into())
    }
}

#[tauri::command]
fn stop_llm() -> Result<String, String> {
    if let Some(mut child) = LLM_PROCESS.get_or_init(|| Mutex::new(None)).lock().unwrap().take() {
        match child.kill() {
            Ok(_) => Ok("🛑 LLM client stopped.".into()),
            Err(e) => Err(format!("❌ Failed to stop llama-server: {}", e)),
        }
    } else {
        Err("⚠️ No LLM client is currently running.".into())
    }
}

#[tauri::command]
fn stop_app() -> Result<String, String> {
    if let Some(mut child) = APP_PROCESS.get_or_init(|| Mutex::new(None)).lock().unwrap().take() {
        match child.kill() {
            Ok(_) => Ok("🛑 App client stopped.".into()),
            Err(e) => Err(format!("❌ Failed to stop app.py: {}", e)),
        }
    } else {
        Err("⚠️ No app client is currently running.".into())
    }
}

#[tauri::command]
fn is_llm_running() -> Result<bool, String> {
    let mut llm_process = LLM_PROCESS.get_or_init(|| Mutex::new(None)).lock().unwrap();
    Ok(cleanup_finished_process(&mut llm_process))
}

#[tauri::command]
fn is_app_running() -> Result<bool, String> {
    let mut app_process = APP_PROCESS.get_or_init(|| Mutex::new(None)).lock().unwrap();
    Ok(cleanup_finished_process(&mut app_process))
}

#[tauri::command]
fn is_voice_running() -> Result<bool, String> {
    let mut voice_process = VOICE_PROCESS.get_or_init(|| Mutex::new(None)).lock().unwrap();
    Ok(cleanup_finished_process(&mut voice_process))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_stronghold::Builder::new(|_password| vec![0u8; 32]).build())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read_dir_recursive,
            read_file,
            create_file,
            create_folder,
            rename_path,
            delete_path,
            move_path,
            save_file,
            read_image,
            
            run_voice,
            run_fasttext,
            run_app,
            run_llm,

            stop_llm,
            stop_voice,
            stop_app,
            is_llm_running,
            is_app_running,
            is_voice_running
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}