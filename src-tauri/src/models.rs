use once_cell::sync::OnceCell;
use tokio::sync::Mutex;
use tokio::process::{Child, Command};
use std::path::Path;

static LLM_PROCESS: OnceCell<Mutex<Option<Child>>> = OnceCell::new();
static CHAT_PROCESS: OnceCell<Mutex<Option<Child>>> = OnceCell::new();
static WEB_PROCESS: OnceCell<Mutex<Option<Child>>> = OnceCell::new();
static RAG_PROCESS: OnceCell<Mutex<Option<Child>>> = OnceCell::new();
static TTS_PROCESS: OnceCell<Mutex<Option<Child>>> = OnceCell::new();
static STT_PROCESS: OnceCell<Mutex<Option<Child>>> = OnceCell::new();

// adjust this if your backend folder is elsewhere
const BACKEND_DIR: &str = r"D:\Programming\Projects\Tauri\haru\src-tauri\backend";

#[tauri::command]
pub async fn run_fasttext() -> Result<String, String> {
    let output = Command::new(r"D:\Programming\Projects\Tauri\haru\src-tauri\models\fasttext.exe")
        .args([
            "predict",
            r"D:\Programming\Projects\Tauri\haru\src-tauri\weights\model.bin",
            r"D:\Programming\Projects\Tauri\haru\src-tauri\weights\input.txt",
        ])
        .output()
        .await
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
pub async fn run_app(process: String, port: Option<u16>, multimodel: Option<bool>) -> Result<String, String> {
    // LLM branch (direct exe, unchanged)
    if process == "llm" {
        let mutex = LLM_PROCESS.get_or_init(|| Mutex::new(None));
        let mut llm_process = mutex.lock().await;

        if llm_process.is_some() {
            return Err("LLM is already running".to_string());
        }

        let mut cmd = Command::new(r"D:\Programming\Projects\Tauri\haru\src-tauri\lib\llama-server.exe");
        let mut args = vec![
            "-m",
            r"D:\Programming\Projects\Tauri\haru\src-tauri\weights\gemma-3-4b-it-q4_0.gguf",
        ];

        if multimodel.unwrap_or(false) {
            args.push("--mmproj");
            args.push(r"D:\Programming\Projects\Tauri\haru\src-tauri\weights\mmproj-model-f16-4B.gguf");
        }

        args.extend(&["-ngl", "99", "-c", "8192", "-t", "6"]);

        let child = cmd.args(&args)
            .spawn()
            .map_err(|e| format!("Failed to start LLM: {}", e))?;

        *llm_process = Some(child);
        return Ok("LLM started successfully".to_string());
    }

    // map process name -> mutex
    let mutex = match process.as_str() {
        "chat" => &CHAT_PROCESS,
        "web"  => &WEB_PROCESS,
        "rag"  => &RAG_PROCESS,
        "tts"  => &TTS_PROCESS,
        "stt"  => &STT_PROCESS,
        _ => return Err("Unknown process".to_string()),
    };

    let mutex = mutex.get_or_init(|| Mutex::new(None));
    let mut app_process = mutex.lock().await;

    if app_process.is_some() {
        return Err(format!("{} is already running", process));
    }

    // port required
    let port = port.ok_or_else(|| format!("Port is required for {}", process))?;
    let app_name = format!("{}_worker:app", process);
    let port_str = port.to_string();

    // check backend dir
    if !Path::new(BACKEND_DIR).exists() {
        return Err(format!("Backend directory not found: {}", BACKEND_DIR));
    }

    // Build python path dynamically
    let user_profile = std::env::var("USERPROFILE")
        .map_err(|e| format!("Failed to get USERPROFILE: {}", e))?;
    let python_path = Path::new(&user_profile)
        .join("miniconda3")
        .join("envs")
        .join("haru")
        .join("python.exe");

    if !python_path.exists() {
        return Err(format!("Python executable not found at: {}", python_path.display()));
    }

    let mut cmd = Command::new(python_path);
    let child = cmd
        .args(["-m", "uvicorn", &app_name])
        .args(["--host", "0.0.0.0", "--port", &port_str])
        .args(["--workers", "1"]) // single process
        .current_dir(BACKEND_DIR)
        .spawn()
        .map_err(|e| format!("Failed to start {}: {}", process, e))?;

    *app_process = Some(child);
    Ok(format!("{} started successfully", process))
}

#[tauri::command]
pub async fn shutdown_app(process: String) -> Result<String, String> {
    let mutex = if process == "llm" {
        &LLM_PROCESS
    } else {
        match process.as_str() {
            "chat" => &CHAT_PROCESS,
            "web" => &WEB_PROCESS,
            "rag" => &RAG_PROCESS,
            "tts" => &TTS_PROCESS,
            "stt" => &STT_PROCESS,
            _ => return Err("Unknown process".to_string()),
        }
    };

    let mutex = mutex.get_or_init(|| Mutex::new(None));
    let mut app_process = mutex.lock().await;

    if let Some(mut child) = app_process.take() {
        // capture pid before killing
        let pid_opt = child.id();

        // best-effort kill of the child handle
        let _ = child.kill().await;

        // On Windows, ensure whole process tree is terminated to avoid orphaned children
        #[cfg(target_os = "windows")]
        {
            if let Some(pid) = pid_opt {
                let pid_str = pid.to_string();
                // run taskkill /PID <pid> /T /F and wait for it
                match Command::new("taskkill").args(&["/PID", &pid_str, "/T", "/F"]).spawn() {
                    Ok(mut t) => {
                        let _ = t.wait().await;
                    }
                    Err(e) => {
                        // return Err? We choose to return an error so caller knows we couldn't force-kill
                        return Err(format!("Failed to taskkill {} (pid {}): {}", process, pid_str, e));
                    }
                }
            }
        }

        Ok(format!("{} shutdown successfully", process))
    } else {
        Err(format!("{} is not running", process))
    }
}

fn cleanup_finished_process(process: &mut Option<Child>) -> bool {
    if let Some(child) = process {
        match child.try_wait() {
            Ok(Some(_status)) => {
                *process = None;
                false
            }
            Ok(None) => true,
            Err(_) => {
                *process = None;
                false
            }
        }
    } else {
        false
    }
}

#[tauri::command]
pub async fn is_running(process: String) -> Result<bool, String> {
    let mutex = match process.as_str() {
        "llm" => &LLM_PROCESS,
        "chat" => &CHAT_PROCESS,
        "web" => &WEB_PROCESS,
        "stt" => &STT_PROCESS,
        "tts" => &TTS_PROCESS,
        "rag" => &RAG_PROCESS,
        _ => return Err("Unknown process".to_string()),
    };

    let mutex = mutex.get_or_init(|| Mutex::new(None));
    let mut proc_lock = mutex.lock().await;

    Ok(cleanup_finished_process(&mut *proc_lock))
}
