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

#[tauri::command]
pub async fn save_image_from_base64(base64_str: String) -> Result<String, String> {
    use base64::{engine::general_purpose, Engine as _};
    use std::fs::File;
    use std::io::Write;
    use std::time::{SystemTime, UNIX_EPOCH};
    use std::env;

    // 1. Split "data:image/png;base64,ENCODED_STRING"
    let parts: Vec<&str> = base64_str.split(',').collect();
    if parts.len() != 2 {
        return Err("Invalid base64 string format".into());
    }

    let data_part = parts[0]; // e.g. "data:image/png;base64"
    let encoded = parts[1];

    // 2. Determine file extension from mime type
    let extension = data_part.split(';').next()
        .and_then(|mime| mime.split('/').last())
        .unwrap_or("png");

    // 3. Decode the base64 string
    let bytes = general_purpose::STANDARD.decode(encoded).map_err(|e| e.to_string())?;

    // 4. Create a unique file name in the system's temp directory
    let temp_dir = env::temp_dir();
    let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
    let file_name = format!("clipboard-{}.{}", timestamp, extension);
    let path = temp_dir.join(file_name);

    // 5. Write the image data to the file
    let mut file = File::create(&path).map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;

    // 6. Return the full path as a string
    path.into_os_string().into_string().map_err(|_| "Failed to convert path to string".into())
}