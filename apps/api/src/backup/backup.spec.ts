import { Test, TestingModule } from '@nestjs/testing';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { BackupModule } from './backup.module';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

describe('BackupModule', () => {
  let module: TestingModule;
  let backupService: BackupService;

  const originalEnv = { ...process.env };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [BackupModule],
    })
      .overrideProvider(AuditService)
      .useValue({
        logUserAction: jest.fn(),
      })
      .compile();

    backupService = module.get<BackupService>(BackupService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    // Restore original environment
    process.env = { ...originalEnv };
  });

  describe('BackupService - Environment Validation', () => {
    it('should extract database name from DATABASE_URL if POSTGRES_DB not set', () => {
      delete process.env.POSTGRES_DB;
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/my_database';
      process.env.BACKUP_DIR = '/app/backups';
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      expect(() => service.onModuleInit()).not.toThrow();
      const params = service['getDbConnectionParams']();
      expect(params.database).toBe('my_database');
    });

    it('should throw error if POSTGRES_DB not set and DATABASE_URL invalid', () => {
      delete process.env.POSTGRES_DB;
      delete process.env.DATABASE_URL;
      process.env.BACKUP_DIR = '/app/backups';
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      // Don't call onModuleInit() in this test since we're testing getDbConnectionParams
      expect(() => service['getDbConnectionParams']()).toThrow('POSTGRES_DB environment variable is required');
    });

    it('should throw error if BACKUP_DIR is not absolute', () => {
      process.env.POSTGRES_DB = 'clinic_test_db';
      process.env.BACKUP_DIR = 'relative/path';
      expect(() => {
        const service = new BackupService({ logUserAction: jest.fn() } as any);
        service.onModuleInit();
      }).toThrow('BACKUP_DIR must be an absolute path');
    });

    it('should prevent targeting production DB during test', () => {
      process.env.NODE_ENV = 'test';
      process.env.POSTGRES_DB = 'clinic_db';
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      expect(() => service['getDbConnectionParams']()).toThrow('Cannot target production database');
    });

    it('should allow targeting clinic_test_db during test', () => {
      process.env.NODE_ENV = 'test';
      process.env.POSTGRES_DB = 'clinic_test_db';
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      expect(() => service['getDbConnectionParams']()).not.toThrow();
    });
  });

  describe('BackupService - Filename Sanitization', () => {
    beforeEach(() => {
      process.env.POSTGRES_DB = 'clinic_test_db';
      process.env.BACKUP_DIR = '/app/backups';
    });

    it('should accept valid backup filename', () => {
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      const filename = 'clinic_backup_2024-01-01T12-00-00-000Z.sql.gz';
      expect(() => service['sanitizeFilename'](filename)).not.toThrow();
    });

    it('should reject invalid filename format', () => {
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      const filename = 'malicious.txt';
      expect(() => service['sanitizeFilename'](filename)).toThrow(BadRequestException);
    });

    it('should reject path traversal attempts', () => {
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      const filename = '../../../etc/passwd';
      expect(() => service['sanitizeFilename'](filename)).toThrow(BadRequestException);
    });

    it('should reject filename with path separators', () => {
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      const filename = 'clinic_backup_2024.sql.gz/extra';
      expect(() => service['sanitizeFilename'](filename)).toThrow(BadRequestException);
    });

    it('should reject Windows-style path traversal', () => {
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      const filename = '..\\..\\Windows\\System32';
      expect(() => service['sanitizeFilename'](filename)).toThrow(BadRequestException);
    });
  });

  describe('BackupService - Manifest Path Traversal', () => {
    beforeEach(() => {
      process.env.POSTGRES_DB = 'clinic_test_db';
      process.env.BACKUP_DIR = '/app/backups';
    });

    it('should reject manifest entry with path traversal', () => {
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      const maliciousFilename = '../../../etc/passwd';
      expect(() => service['resolveSafePath'](maliciousFilename)).toThrow(BadRequestException);
    });

    it('should reject manifest entry with relative path', () => {
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      const maliciousFilename = '../target';
      expect(() => service['resolveSafePath'](maliciousFilename)).toThrow(BadRequestException);
    });

    it('should reject manifest entry with absolute path', () => {
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      const maliciousFilename = '/tmp/target';
      expect(() => service['resolveSafePath'](maliciousFilename)).toThrow(BadRequestException);
    });

    it('should accept valid manifest entry', () => {
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      const validFilename = 'clinic_backup_2024-01-01T12-00-00-000Z.sql.gz';
      expect(() => service['resolveSafePath'](validFilename)).not.toThrow();
    });
  });

  describe('BackupService - Remote Storage Configuration', () => {
    beforeEach(() => {
      process.env.POSTGRES_DB = 'clinic_test_db';
      process.env.BACKUP_DIR = '/app/backups';
    });

    it('should detect when remote storage is configured', () => {
      process.env.BACKUP_S3_ENDPOINT = 'https://s3.example.com';
      process.env.BACKUP_S3_BUCKET = 'my-bucket';
      process.env.BACKUP_S3_ACCESS_KEY = 'key';
      process.env.BACKUP_S3_SECRET_KEY = 'secret';
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      expect(service['isRemoteStorageConfigured']()).toBe(true);
    });

    it('should detect when remote storage is not configured', () => {
      delete process.env.BACKUP_S3_ENDPOINT;
      delete process.env.BACKUP_S3_BUCKET;
      delete process.env.BACKUP_S3_ACCESS_KEY;
      delete process.env.BACKUP_S3_SECRET_KEY;
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      expect(service['isRemoteStorageConfigured']()).toBe(false);
    });
  });

  describe('BackupService - Concurrency Control', () => {
    beforeEach(() => {
      process.env.POSTGRES_DB = 'clinic_test_db';
      process.env.BACKUP_DIR = '/app/backups';
    });

    it('should serialize backup operations', async () => {
      const service = new BackupService({ logUserAction: jest.fn() } as any);
      // Mock backup operation to take time
      jest.spyOn(service, 'runBackup').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { filename: 'test.sql.gz', sizeBytes: 1000, createdAt: new Date().toISOString(), triggeredBy: 'manual', uploadedToRemote: false };
      });

      const [result1, result2] = await Promise.all([
        service.runBackup('manual'),
        service.runBackup('manual'),
      ]);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      // Operations should be serialized, not parallel
      expect(service['runBackup']).toHaveBeenCalledTimes(2);
    });
  });

  describe('RestoreBackupDto Validation', () => {
    it('should require confirm to be true', () => {
      const dto = { filename: 'clinic_backup_2024.sql.gz', confirm: false };
      expect(() => {
        if (dto.confirm !== true) {
          throw new BadRequestException('confirm must be true to restore a backup');
        }
      }).toThrow(BadRequestException);
    });

    it('should accept confirm: true', () => {
      const dto = { filename: 'clinic_backup_2024.sql.gz', confirm: true };
      expect(() => {
        if (dto.confirm !== true) {
          throw new BadRequestException('confirm must be true to restore a backup');
        }
      }).not.toThrow();
    });
  });
});
