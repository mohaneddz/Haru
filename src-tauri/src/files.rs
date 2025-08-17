use std::path::{Path, PathBuf};
use std::{fs, io};

#[tauri::command]
pub fn read_dir_recursive(path: String, depth: Option<u32>) -> Result<Vec<String>, String> {
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
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_file(dir: String, name: Option<String>) -> Result<String, String> {
    let base_name = name.unwrap_or_else(|| "New Note".to_string());
    let ext = ".md";
    let mut count = 0;

    loop {
        let file_name = if count == 0 {
            format!("{}{}", base_name, ext)
        } else {
            format!("{} ({}){}", base_name, count, ext)
        };
        let full_path = Path::new(&dir).join(&file_name);

        if !full_path.exists() {
            fs::write(&full_path, "").map_err(|e| e.to_string())?;
            return Ok(full_path.to_string_lossy().to_string());
        }
        count += 1;
    }
}

#[tauri::command]
pub fn save_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_folder(dir: String) -> Result<String, String> {
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
pub fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_path(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if p.is_dir() {
        fs::remove_dir_all(&p).map_err(|e| e.to_string())
    } else {
        fs::remove_file(&p).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn move_path(source: String, destination: String) -> Result<(), String> {
    fs::rename(&source, &destination).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn verify_folder(path: String) -> Result<bool, String> {
    let p = Path::new(&path);
    Ok(p.exists() && p.is_dir())
}

#[tauri::command]
pub fn verify_file(path: String) -> Result<bool, String> {
    let p = Path::new(&path);
    Ok(p.exists() && p.is_file())
}
