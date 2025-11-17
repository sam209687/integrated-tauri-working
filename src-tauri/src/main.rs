#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Child};
use std::thread;
use std::time::Duration;

fn start_nextjs_server() -> Child {
    #[cfg(target_os = "windows")]
    let child = Command::new("cmd")
        .args(["/C", "npm", "run", "start"])
        .spawn()
        .expect("Failed to start Next.js server");

    #[cfg(not(target_os = "windows"))]
    let child = Command::new("npm")
        .args(["run", "start"])
        .spawn()
        .expect("Failed to start Next.js server");

    // Wait for server to start
    thread::sleep(Duration::from_secs(3));
    
    child
}

fn main() {
    // Start Next.js server
    let _server = start_nextjs_server();

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}