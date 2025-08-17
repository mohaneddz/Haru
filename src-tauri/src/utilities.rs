use std::fs;
use std::io::Cursor;
use std::env;
use std::fs::File;
use std::io::Write;
use std::time::{SystemTime, UNIX_EPOCH};
use base64::{engine::general_purpose, Engine as _};
use image::ImageFormat;
use pdfium_render::prelude::*;

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
    let parts: Vec<&str> = base64_str.split(',').collect();
    if parts.len() != 2 {
        return Err("Invalid base64 string format".into());
    }

    let data_part = parts[0];
    let encoded = parts[1];

    let extension = data_part.split(';').next()
        .and_then(|mime| mime.split('/').last())
        .unwrap_or("png");

    let bytes = general_purpose::STANDARD.decode(encoded).map_err(|e| e.to_string())?;

    let temp_dir = env::temp_dir();
    let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
    let file_name = format!("clipboard-{}.{}", timestamp, extension);
    let path = temp_dir.join(file_name);

    let mut file = File::create(&path).map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;

    path.into_os_string().into_string().map_err(|_| "Failed to convert path to string".into())
}

#[tauri::command]
pub fn generate_pdf_thumbnail(pdf_path: String) -> Result<String, String> {
    let pdfium = Pdfium::new(
        Pdfium::bind_to_library(Pdfium::pdfium_platform_library_name_at_path("./bin/"))
            .or_else(|_| Pdfium::bind_to_system_library())
            .map_err(|e| e.to_string())?,
    );

    let document = pdfium.load_pdf_from_file(&pdf_path, None)
        .map_err(|e| e.to_string())?;

    // --- FIX 3: Use .map_err() on Result instead of .ok_or_else() ---
    let page = document.pages().get(0)
        .map_err(|_| "PDF has no pages".to_string())?;

    let bitmap = page.render_with_config(
        &PdfRenderConfig::new()
            .set_target_width(280)
            .set_maximum_height(360)
    )
    .map_err(|e| e.to_string())?;

    let image = bitmap.as_image();

    let mut buffer = Cursor::new(Vec::new());
    image.write_to(&mut buffer, ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    let base64_string = general_purpose::STANDARD.encode(buffer.get_ref());

    Ok(format!("data:image/png;base64,{}", base64_string))
}