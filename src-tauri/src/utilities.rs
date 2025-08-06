// use tauri::State;
// use tauri_plugin_stronghold::{StrongholdPlugin, SaveOptions};
use base64::{engine::general_purpose, Engine as _};
use std::fs;

// // CORRECT: Uses `State<StrongholdPlugin>` which Tauri injects automatically.
// #[tauri::command]
// pub fn set_stronghold_value(
//     key: String,
//     value: String,
//     stronghold: State<StrongholdPlugin>,
// ) -> Result<(), String> {
//     stronghold.insert(None, key.into_bytes(), value.into_bytes())
//         .map_err(|e| e.to_string())?;

//     stronghold.save(None, None::<SaveOptions>)
//         .map_err(|e| e.to_string())?;

//     Ok(())
// }

// // CORRECT: Uses `State<StrongholdPlugin>`
// #[tauri::command]
// pub fn get_stronghold_value(
//     key: String,
//     stronghold: State<StrongholdPlugin>,
// ) -> Result<String, String> {
//     let value_bytes = stronghold.get(None, key.as_bytes().to_vec())
//         .map_err(|e| e.to_string())?
//         .ok_or_else(|| format!("Key '{}' not found in Stronghold", key))?;

//     String::from_utf8(value_bytes).map_err(|e| e.to_string())
// }

// These file functions are fine as they are.
#[tauri::command]
pub fn read_pdf(path: String) -> Result<String, String> {
    let bytes = fs::read(&path).map_err(|e| format!("Failed to read PDF file: {}", e))?;
    let encoded = general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:application/pdf;base64,{}", encoded))
}

#[tauri::command]
pub fn read_image(path: String) -> Result<String, String> {
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    let encoded = general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:image/png;base64,{}", encoded))
}
