import { LanguageAdapter, AdapterProjectContext, AdaptedCode, FileStructure, TestFramework } from './LanguageAdapter'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'

const execAsync = promisify(exec)

/**
 * Rust language adapter for Actix-web framework
 * Converts agent output to Rust/Actix-web code structure with Result types and ownership patterns
 *
 * @example
 * ```typescript
 * const adapter = new RustAdapter()
 * const result = await adapter.adaptCode({
 *   endpoint: 'get_users',
 *   method: 'GET',
 *   path: '/users',
 *   responseType: 'Vec<User>'
 * }, { framework: 'actix-web', language: 'rust', targetDirectory: './my-project' })
 *
 * // Returns Actix-web handler with Result<HttpResponse> and proper error handling
 * ```
 */
export class RustAdapter implements LanguageAdapter {
  readonly language = 'rust' as const

  /**
   * Adapts agent output to Rust code with proper formatting
   * Generates Actix-web handlers with Result types and ownership patterns
   *
   * @param agentOutput - The agent's code generation output
   * @param context - Project context including framework information
   * @returns Adapted code with file paths and project structure
   *
   * @example
   * ```typescript
   * const adapter = new RustAdapter()
   * const result = await adapter.adaptCode({
   *   endpoint: 'create_user',
   *   method: 'POST',
   *   path: '/users',
   *   requestType: 'CreateUserRequest',
   *   responseType: 'User'
   * }, { framework: 'actix-web', language: 'rust', targetDirectory: './api' })
   *
   * // Generates POST handler with web::Json<CreateUserRequest> input
   * ```
   */
  async adaptCode(agentOutput: Record<string, unknown>, context: AdapterProjectContext): Promise<AdaptedCode> {
    const code = this.generateActixCode(agentOutput)
    const formatted = await this.formatCode(code)

    // Type narrowing for endpoint
    const endpoint = typeof agentOutput.endpoint === 'string' ? agentOutput.endpoint : 'handler'

    return {
      files: [{
        path: this.getFilePath(endpoint),
        content: formatted
      }],
      projectStructure: this.getProjectStructure(context.framework)
    }
  }

  /**
   * Gets the project structure for a given Rust framework
   *
   * @param framework - The framework name (e.g., 'actix-web')
   * @returns File structure with directories and config files
   *
   * @throws {Error} If framework is not supported
   *
   * @example
   * ```typescript
   * const adapter = new RustAdapter()
   * const structure = adapter.getProjectStructure('actix-web')
   *
   * // Returns standard Rust project with Cargo.toml, src/main.rs, etc.
   * ```
   */
  getProjectStructure(framework: string): FileStructure {
    if (framework === 'actix-web') {
      return {
        directories: [
          'src/handlers',
          'src/models',
          'src/services',
          'tests'
        ],
        configFiles: [
          {
            path: 'Cargo.toml',
            content: `[package]
name = "rust-api"
version = "0.1.0"
edition = "2021"

[dependencies]
actix-web = "4.4"
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
dotenv = "0.15"
env_logger = "0.11"

[dev-dependencies]
proptest = "1.4"
actix-rt = "2.9"`
          },
          {
            path: 'src/main.rs',
            content: `use actix_web::{web, App, HttpServer};
use dotenv::dotenv;
use std::env;

mod handlers;
mod models;
mod services;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init();

    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let bind_address = format!("{}:{}", host, port);

    println!("Starting server at http://{}", bind_address);

    HttpServer::new(|| {
        App::new()
            .service(
                web::scope("/api")
                    // Add your routes here
            )
    })
    .bind(&bind_address)?
    .run()
    .await
}`
          },
          {
            path: '.env.example',
            content: `# Server Configuration
HOST=127.0.0.1
PORT=8080
RUST_LOG=info

# Database
DATABASE_URL=postgres://user:password@localhost:5432/dbname`
          },
          {
            path: 'Makefile',
            content: `build:
\tcargo build --release

test:
\tcargo test

run:
\tcargo run

fmt:
\tcargo fmt

lint:
\tcargo clippy -- -D warnings

watch:
\tcargo watch -x run`
          }
        ]
      }
    }

    throw new Error(`Unsupported framework: ${framework}`)
  }

  /**
   * Gets the testing framework configuration for Rust
   * Configures cargo test with proptest for property-based testing
   *
   * @returns Testing framework configuration for cargo test + proptest
   *
   * @example
   * ```typescript
   * const adapter = new RustAdapter()
   * const framework = adapter.getTestingFramework()
   *
   * // Returns { name: 'cargo test + proptest', fileExtension: '.rs', ... }
   * ```
   */
  getTestingFramework(): TestFramework {
    return {
      name: 'cargo test + proptest',
      fileExtension: '.rs',
      importPattern: `#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    // Property-based tests
    proptest! {
        #[test]
        fn test_property(input in any::<String>()) {
            // Test implementation
        }
    }
}`
    }
  }

  /**
   * Formats Rust code using rustfmt
   * Uses temporary file approach to avoid shell injection vulnerabilities
   *
   * @param code - The Rust code to format
   * @returns Formatted code, or original code if rustfmt is unavailable
   *
   * @security CRITICAL: Uses temp file to prevent shell injection
   *
   * @example
   * ```typescript
   * const adapter = new RustAdapter()
   * const formatted = await adapter.formatCode('pub fn main(){println!("test");}')
   * // Returns properly formatted Rust code
   * ```
   */
  async formatCode(code: string): Promise<string> {
    const tempFile = `/tmp/format-${Date.now()}-${Math.random().toString(36).substring(7)}.rs`

    try {
      // Write code to temp file to avoid shell injection
      await writeFile(tempFile, code, 'utf-8')

      // Format with rustfmt
      await execAsync(`rustfmt "${tempFile}"`)

      // Read formatted code
      const { stdout } = await execAsync(`cat "${tempFile}"`)

      // Clean up temp file
      await unlink(tempFile)

      return stdout
    } catch (error) {
      // Clean up temp file on error
      try {
        await unlink(tempFile)
      } catch {
        // Ignore cleanup errors
      }

      console.warn('rustfmt not available, skipping formatting')
      return code
    }
  }

  /**
   * Generates Actix-web handler code from agent output
   * Creates handlers with Result<HttpResponse> types and proper error handling
   *
   * @param agentOutput - Agent output containing endpoint configuration
   * @returns Generated Actix-web Rust code
   *
   * @private
   *
   * @example
   * ```typescript
   * // Internal use - generates:
   * // pub async fn get_users() -> Result<HttpResponse> {
   * //     let users: Vec<User> = vec![];
   * //     Ok(HttpResponse::Ok().json(users))
   * // }
   * ```
   */
  private generateActixCode(agentOutput: Record<string, unknown>): string {
    // Type narrowing with defaults
    const endpoint = typeof agentOutput.endpoint === 'string' ? agentOutput.endpoint : 'handler'
    const method = typeof agentOutput.method === 'string' ? agentOutput.method : 'GET'
    const path = typeof agentOutput.path === 'string' ? agentOutput.path : '/'
    const responseType = typeof agentOutput.responseType === 'string' ? agentOutput.responseType : 'Value'
    const requestType = typeof agentOutput.requestType === 'string' ? agentOutput.requestType : null

    // Extract type name from responseType (e.g., 'Vec<User>' -> 'User')
    const baseType = responseType.includes('<')
      ? responseType.match(/<([^>]+)>/)?.[1] || 'Item'
      : responseType

    const imports = [
      'use actix_web::{web, HttpResponse, Result};',
      'use serde::{Deserialize, Serialize};'
    ]

    let structs = ''
    let functionParams = ''

    // Add request type struct if POST/PUT/PATCH
    if (requestType && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      structs += `
#[derive(Deserialize)]
pub struct ${requestType} {
    // TODO: Define request fields
}

`
      functionParams = `request: web::Json<${requestType}>`
    }

    // Add response type struct
    structs += `#[derive(Serialize)]
pub struct ${baseType} {
    pub id: u32,
    pub name: String,
}
`

    const functionBody = requestType
      ? `    // TODO: Implement business logic

    // Example: Process request data
    let data = request.into_inner();

    let result = ${baseType} {
        id: 1,
        name: "Example".to_string(),
    };

    Ok(HttpResponse::Ok().json(result))`
      : `    // TODO: Implement business logic

    let users: ${responseType} = vec![];

    Ok(HttpResponse::Ok().json(users))`

    return `${imports.join('\n')}

${structs}
/// Handler for ${method} ${path}
pub async fn ${endpoint}(${functionParams}) -> Result<HttpResponse> {
${functionBody}
}
`
  }

  /**
   * Converts Rust function name to filename
   * Preserves snake_case naming convention
   *
   * @param endpoint - Function name (e.g., 'get_users')
   * @returns File path (e.g., 'src/handlers/get_users.rs')
   *
   * @private
   */
  private getFilePath(endpoint: string): string {
    return `src/handlers/${endpoint}.rs`
  }
}
