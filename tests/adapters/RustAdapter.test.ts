import { RustAdapter } from '../../src/adapters/RustAdapter'
import { AdapterProjectContext } from '../../src/adapters/LanguageAdapter'

describe('RustAdapter', () => {
  let adapter: RustAdapter
  let context: AdapterProjectContext

  beforeEach(() => {
    adapter = new RustAdapter()
    context = {
      language: 'rust',
      framework: 'actix-web',
      targetDirectory: '/tmp/test-project'
    }
  })

  describe('adaptCode', () => {
    it('should generate Actix-web handler with Result types', async () => {
      const agentOutput = {
        endpoint: 'get_users',
        method: 'GET',
        path: '/users',
        responseType: 'Vec<User>',
      }

      const result = await adapter.adaptCode(agentOutput, context)

      expect(result.files).toHaveLength(1)
      expect(result.files[0].path).toBe('src/handlers/get_users.rs')
      expect(result.files[0].content).toContain('use actix_web::{web, HttpResponse, Result}')
      expect(result.files[0].content).toContain('use serde::{Deserialize, Serialize}')
      expect(result.files[0].content).toContain('pub async fn get_users() -> Result<HttpResponse>')
      expect(result.files[0].content).toContain('Ok(HttpResponse::Ok().json(')
      expect(result.files[0].content).toContain('#[derive(Serialize)]')
      expect(result.files[0].content).toContain('pub struct User')
    })

    it('should handle error patterns with ownership', async () => {
      const agentOutput = {
        endpoint: 'create_user',
        method: 'POST',
        path: '/users',
        requestType: 'CreateUserRequest',
        responseType: 'User',
      }

      const result = await adapter.adaptCode(agentOutput, context)

      expect(result.files[0].content).toContain('use actix_web::{web, HttpResponse, Result}')
      expect(result.files[0].content).toContain('pub async fn create_user')
      expect(result.files[0].content).toContain('web::Json')
      expect(result.files[0].content).toContain('Result<HttpResponse>')
      expect(result.files[0].content).toContain('#[derive(Deserialize)]')
      expect(result.files[0].content).toContain('pub struct CreateUserRequest')
    })
  })

  describe('getProjectStructure', () => {
    it('should return standard Rust project structure', () => {
      const structure = adapter.getProjectStructure('actix-web')

      expect(structure.directories).toContain('src/handlers')
      expect(structure.directories).toContain('src/models')
      expect(structure.directories).toContain('src/services')
      expect(structure.directories).toContain('tests')

      const cargoToml = structure.configFiles.find(f => f.path === 'Cargo.toml')
      expect(cargoToml).toBeDefined()
      expect(cargoToml!.content).toContain('actix-web')
      expect(cargoToml!.content).toContain('tokio')
      expect(cargoToml!.content).toContain('serde')

      const mainRs = structure.configFiles.find(f => f.path === 'src/main.rs')
      expect(mainRs).toBeDefined()
      expect(mainRs!.content).toContain('use actix_web::')
      expect(mainRs!.content).toContain('#[actix_web::main]')
      expect(mainRs!.content).toContain('HttpServer::new')
    })
  })

  describe('getTestingFramework', () => {
    it('should configure cargo test with proptest', () => {
      const config = adapter.getTestingFramework()

      expect(config.name).toBe('cargo test + proptest')
      expect(config.fileExtension).toBe('.rs')
      expect(config.importPattern).toContain('use proptest::prelude::*')
      expect(config.importPattern).toContain('#[cfg(test)]')
    })
  })
})
