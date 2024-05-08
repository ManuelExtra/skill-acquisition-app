import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/auth/decorators/auth.decorator';
import {
  AudioFileSizeValidationPipe,
  DocumentFileSizeValidationPipe,
  ImageFileSizeValidationPipe,
  VideoFileSizeValidationPipe,
} from './pipes/file-validation.pipe';
import { UploadService } from './upload.service';

@Controller('v1/upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @UploadedFile(new ImageFileSizeValidationPipe())
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadImage(file);
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('video'))
  uploadVideo(
    @UploadedFile(new VideoFileSizeValidationPipe())
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadVideo(file);
  }

  @Post('doc')
  @UseInterceptors(FileInterceptor('doc'))
  uploadDoc(
    @UploadedFile(new DocumentFileSizeValidationPipe())
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadFile(file, 'doc');
  }

  @Post('audio')
  @UseInterceptors(FileInterceptor('audio'))
  uploadAudio(
    @UploadedFile(new AudioFileSizeValidationPipe())
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadFile(file, 'audio');
  }
}
