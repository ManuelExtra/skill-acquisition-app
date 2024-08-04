import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ImageFileSizeValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (typeof value === 'undefined') {
      throw new BadRequestException('Image file is required');
    }

    const { mimetype, size } = value;
    const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!MIME_TYPES.includes(mimetype)) {
      throw new BadRequestException(
        'The image file should be either jpeg, png, or webp.',
      );
    }

    if (size > 1000000) {
      throw new BadRequestException(`File size should be at most 1MB`);
    }

    return value;
  }
}

@Injectable()
export class VideoFileSizeValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (typeof value === 'undefined') {
      throw new BadRequestException('Video file is required');
    }

    const { mimetype, size } = value;

    const MIME_TYPES = ['video/webm', 'video/mp4', 'video/mpeg'];
    if (!MIME_TYPES.includes(mimetype)) {
      throw new BadRequestException(
        'The video file should be either webm, mp4, or mpeg.',
      );
    }

    if (size > 50000000) {
      throw new BadRequestException(`File size should be at most 50MB`);
    }

    return value;
  }
}

@Injectable()
export class DocumentFileSizeValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (typeof value === 'undefined') {
      throw new BadRequestException('Document file is required');
    }

    const { mimetype, size } = value;

    const MIME_TYPES = [
      // pdf
      'application/pdf',
      // ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/mspowerpoint',
      'application/powerpoint',
      'application/vnd.ms-powerpoint',
      'application/x-mspowerpoint',
      // doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/doc',
      'application/ms-doc',
      'application/msword',
    ];
    if (!MIME_TYPES.includes(mimetype)) {
      throw new BadRequestException(
        `The document file should be in a pdf, ppt or doc format`,
      );
    }

    if (size > 2000000) {
      throw new BadRequestException(`File size should be at most 2MB`);
    }

    return value;
  }
}

@Injectable()
export class AudioFileSizeValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    if (typeof value === 'undefined') {
      throw new BadRequestException('Audio file is required');
    }

    const { mimetype, size } = value;
    console.log(mimetype);
    const MIME_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/wma'];
    if (!MIME_TYPES.includes(mimetype)) {
      throw new BadRequestException(
        `The audio file should be in the following formats: ${MIME_TYPES.join(
          ', ',
        )}.`,
      );
    }

    if (size > 10000000) {
      throw new BadRequestException(`File size should be at most 10MB`);
    }

    return value;
  }
}
