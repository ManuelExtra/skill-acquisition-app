import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { CloudinaryProvider } from './providers/cloudinary';

@Module({
  providers: [UploadService, CloudinaryProvider],
  controllers: [UploadController],
  exports: [UploadService, CloudinaryProvider],
})
export class UploadModule {}
