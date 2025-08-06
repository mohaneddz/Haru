static VOICE_PROCESS: OnceCell<Mutex<Option<Child>>> = OnceCell::new();
static LLM_PROCESS: OnceCell<Mutex<Option<Child>>> = OnceCell::new();
static APP_PROCESS: OnceCell<Mutex<Option<Child>>> = OnceCell::new();

use once_cell::sync::OnceCell;
use std::process::{Child, Command};
use std::sync::Mutex;

fn cleanup_finished_process(child_opt: &mut Option<Child>) -> bool {
    if let Some(child) = child_opt {
        match child.try_wait() {
            Ok(Some(_)) => {
                // Process has exited
                *child_opt = None; // Remove the handle
                return false; // It's not running
            }
            Ok(None) => {
                // Process is still running
                return true;
            }
            Err(_) => {
                // Error checking status, assume it's dead for safety
                *child_opt = None;
                return false;
            }
        }
    }
    false // It's not running if it was None to begin with
}

#[tauri::command]
pub fn run_fasttext() -> Result<String, String> {
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
    let result =
        String::from_utf8(output.stdout).map_err(|e| format!("Invalid UTF-8 in output: {}", e))?;
    Ok(result.trim().to_string())
}

#[tauri::command]
pub fn run_app() -> Result<String, String> {
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
pub fn run_voice() -> Result<String, String> {
    let mut voice_process = VOICE_PROCESS
        .get_or_init(|| Mutex::new(None))
        .lock()
        .unwrap();
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
pub fn run_llm() -> Result<String, String> {
    let mut llm_process = LLM_PROCESS.get_or_init(|| Mutex::new(None)).lock().unwrap();
    // Use the helper to check if the process is truly running
    if cleanup_finished_process(&mut llm_process) {
        return Err("⚠️ LLM client is already running.".into());
    }
    let child =
        Command::new("D:\\Programming\\Projects\\Tauri\\haru\\backend\\lib\\llama-server.exe")
            .arg("-m")
            .arg("D:\\Programming\\Projects\\Tauri\\haru\\backend\\models\\gemma-3-4b-it-q4_0.gguf")
            .arg("-ngl")
            .arg("99")
            .arg("-c")
            .arg("8192")
            .arg("-t")
            .arg("6")
            .current_dir("D:\\Programming\\Projects\\Tauri\\haru\\backend")
            .spawn()
            .map_err(|e| format!("❌ Failed to start llama-server: {}", e))?;
    llm_process.replace(child);
    Ok("✅ LLM client started.".into())
}

#[tauri::command]
pub fn stop_voice() -> Result<String, String> {
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

#[tauri::command]
pub fn stop_llm() -> Result<String, String> {
    if let Some(mut child) = LLM_PROCESS
        .get_or_init(|| Mutex::new(None))
        .lock()
        .unwrap()
        .take()
    {
        match child.kill() {
            Ok(_) => Ok("🛑 LLM client stopped.".into()),
            Err(e) => Err(format!("❌ Failed to stop llama-server: {}", e)),
        }
    } else {
        Err("⚠️ No LLM client is currently running.".into())
    }
}

#[tauri::command]
pub fn stop_app() -> Result<String, String> {
    if let Some(mut child) = APP_PROCESS
        .get_or_init(|| Mutex::new(None))
        .lock()
        .unwrap()
        .take()
    {
        match child.kill() {
            Ok(_) => Ok("🛑 App client stopped.".into()),
            Err(e) => Err(format!("❌ Failed to stop app.py: {}", e)),
        }
    } else {
        Err("⚠️ No app client is currently running.".into())
    }
}

#[tauri::command]
pub fn is_llm_running() -> Result<bool, String> {
    let mut llm_process = LLM_PROCESS.get_or_init(|| Mutex::new(None)).lock().unwrap();
    Ok(cleanup_finished_process(&mut llm_process))
}

#[tauri::command]
pub fn is_app_running() -> Result<bool, String> {
    let mut app_process = APP_PROCESS.get_or_init(|| Mutex::new(None)).lock().unwrap();
    Ok(cleanup_finished_process(&mut app_process))
}

#[tauri::command]
pub fn is_voice_running() -> Result<bool, String> {
    let mut voice_process = VOICE_PROCESS
        .get_or_init(|| Mutex::new(None))
        .lock()
        .unwrap();
    Ok(cleanup_finished_process(&mut voice_process))
}
