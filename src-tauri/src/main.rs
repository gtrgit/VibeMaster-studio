// Prevents console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::sync::Mutex;
use std::env;

struct SimulationState {
    running: Mutex<bool>,
}

#[tauri::command]
fn start_simulation() -> Result<String, String> {
    println!("Starting simulation...");
    
    // For now, just return success
    // We'll hook up the actual simulation next
    Ok("Simulation started".to_string())
}

#[tauri::command]
fn stop_simulation() -> Result<String, String> {
    println!("Stopping simulation...");
    Ok("Simulation stopped".to_string())
}

#[tauri::command]
fn get_world_state() -> Result<String, String> {
    // Try to call the real database
    let output = Command::new("node")
        .arg("dist/get-world-state.js")
        .current_dir(env::current_dir().unwrap().parent().unwrap()) // Go up from src-tauri
        .output();

    match output {
        Ok(result) => {
            let stdout = String::from_utf8(result.stdout)
                .unwrap_or_else(|_| "{}".to_string());
            
            if !stdout.trim().is_empty() {
                Ok(stdout)
            } else {
                // Fallback to mock data if no real data
                let mock_data = r#"{
                    "currentDay": 1,
                    "currentHour": 12,
                    "npcs": [
                        {"name": "Marcus", "needFood": 45, "needSafety": 80},
                        {"name": "Sarah", "needFood": 90, "needSafety": 95},
                        {"name": "Emma", "needFood": 70, "needSafety": 75}
                    ]
                }"#;
                Ok(mock_data.to_string())
            }
        }
        Err(_) => {
            // Fallback to mock data if command fails
            let mock_data = r#"{
                "currentDay": 1,
                "currentHour": 12,
                "npcs": [
                    {"name": "Marcus", "needFood": 45, "needSafety": 80},
                    {"name": "Sarah", "needFood": 90, "needSafety": 95},
                    {"name": "Emma", "needFood": 70, "needSafety": 75}
                ]
            }"#;
            Ok(mock_data.to_string())
        }
    }
}

fn main() {
    tauri::Builder::default()
        .manage(SimulationState {
            running: Mutex::new(false),
        })
        .invoke_handler(tauri::generate_handler![
            start_simulation,
            stop_simulation,
            get_world_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}