use std::path::{Path, PathBuf};
use std::{fs, io};
use std::process::{Command, Child};
use once_cell::sync::OnceCell;
use std::sync::Mutex;

static VOICE_PROCESS: OnceCell<Mutex<Option<Child>>> = OnceCell::new();

#[tauri::command]
fn read_dir_recursive(path: String) -> Result<Vec<String>, String> {
    fn walk_dir(dir: PathBuf, acc: &mut Vec<String>) -> io::Result<()> {
        // Always include the folder itself with a trailing slash
        acc.push(format!("{}/", dir.to_string_lossy()));

        for entry in fs::read_dir(&dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                walk_dir(path, acc)?; // Recurse
            } else {
                acc.push(path.to_string_lossy().to_string()); // Add file
            }
        }
        Ok(())
    }

    let mut result = Vec::new();
    walk_dir(PathBuf::from(path.clone()), &mut result).map_err(|e| e.to_string())?;
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
    use std::process::Command;

    let output = Command::new("D:\\Programming\\Projects\\Tauri\\haru\\models\\fasttext.exe")
        .args([
            "predict",
            "D:\\Programming\\Projects\\Tauri\\haru\\models\\model.bin",
            "D:\\Programming\\Projects\\Tauri\\haru\\models\\input.txt",
        ])
        .output()
        .map_err(|e| format!("Failed to execute: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "FastText failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let result = String::from_utf8(output.stdout)
        .map_err(|e| format!("Invalid UTF-8 in output: {}", e))?;

    Ok(result.trim().to_string())
}

#[tauri::command]
fn run_llm() -> Result<String, String> {
    let child = Command::new("C:\\Users\\Mohaned\\miniconda3\\envs\\haru\\python.exe")
        .arg("D:\\Programming\\Projects\\Tauri\\haru\\backend\\app.py")
        .spawn()
        .map_err(|e| format!("❌ Failed to start app.py: {}", e))?;

    VOICE_PROCESS
        .get_or_init(|| Mutex::new(None))
        .lock()
        .unwrap()
        .replace(child);

    Ok("✅ Voice client started.".into())
}

#[tauri::command]
fn run_voice() -> Result<String, String> {
    let child = Command::new("C:\\Users\\Mohaned\\miniconda3\\envs\\haru\\python.exe")
        .arg("D:\\Programming\\Projects\\Tauri\\haru\\models\\voice.py")
        .spawn()
        .map_err(|e| format!("❌ Failed to start voice.py: {}", e))?;

    VOICE_PROCESS
        .get_or_init(|| Mutex::new(None))
        .lock()
        .unwrap()
        .replace(child);

    Ok("✅ Voice client started.".into())
}

#[tauri::command]
fn stop_voice() -> Result<String, String> {
    if let Some(mut child) = VOICE_PROCESS
        .get_or_init(|| Mutex::new(None))
        .lock()
        .unwrap()
        .take()
    {
        match child.kill() {
            Ok(_) => Ok("🛑 Voice client stopped.".into()),
            Err(e) => Err(format!("❌ Failed to stop voice.py: {}", e)),
        }
    } else {
        Err("⚠️ No voice client is currently running.".into())
    }
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
            run_voice,
            create_file,
            create_folder,
            rename_path,
            delete_path,
            move_path,
            save_file,
            stop_voice,
            run_fasttext,
            run_llm
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
