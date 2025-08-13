mod files;
mod models;
mod clipboard;
mod utilities;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_x::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            files::read_dir_recursive,
            files::read_file,
            files::create_file,
            files::create_folder,
            files::rename_path,
            files::delete_path,
            files::move_path,
            files::save_file,
            files::verify_file,
            files::verify_folder,
            utilities::read_image,
            utilities::read_pdf,
            utilities::save_image_from_base64,
            clipboard::get_clipboard_files_command,
            // utilities::get_pdf_first_page,
            models::is_running,
            models::run_fasttext,
            models::run_app,
            models::shutdown_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
