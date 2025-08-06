// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    dotenvy::dotenv().ok(); // Loads .env file
                            // Now you can use std::env::var("API_URL") etc.
    haru_lib::run()
}
