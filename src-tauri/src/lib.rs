use std::{fs, io};
use std::path::PathBuf;

/// Recursively read all file paths under the given directory
#[tauri::command]
fn read_dir_recursive(path: String) -> Result<Vec<String>, String> {
    fn walk_dir(dir: PathBuf, acc: &mut Vec<String>) -> io::Result<()> {
        for entry in fs::read_dir(&dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                walk_dir(path, acc)?;
            } else {
                acc.push(path.to_string_lossy().to_string());
            }
        }
        Ok(())
    }

    let mut result = Vec::new();
    walk_dir(PathBuf::from(path.clone()), &mut result)
        .map_err(|e| e.to_string())?;
    Ok(result)
}

/// Read the entire contents of a given file as a UTF-8 string
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_stronghold::Builder::new(|_password| vec![0u8; 32]).build())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        // register both commands
        .invoke_handler(tauri::generate_handler![
            read_dir_recursive,
            read_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
