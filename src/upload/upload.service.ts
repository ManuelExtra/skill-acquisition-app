import { Injectable } from '@nestjs/common';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';
import toStream = require('buffer-to-stream');
const streamifier = require('streamifier');

@Injectable()
export class UploadService {
  /**
   * Upload an image file
   * @param file
   * @returns
   */
  uploadImage(file: Express.Multer.File) {
    // Promise<UploadApiResponse | UploadApiErrorResponse>;

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream((error, result) => {
        if (error) return reject(error);

        const { secure_url } = result;

        resolve({
          image: secure_url,
        });
      });

      streamifier.createReadStream(file.buffer).pipe(upload);
    });
  }

  /**
   * Upload an video file
   * @param file
   * @returns
   */
  uploadVideo(file: Express.Multer.File) {
    // Promise<UploadApiResponse | UploadApiErrorResponse>;

    // console.log(file.buffer.toString());
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
        },
        (error, result) => {
          if (error) {
            console.log(error);
            return reject(error);
          }

          const { secure_url } = result;

          resolve({
            video: secure_url,
          });
        },
      );

      streamifier.createReadStream(file.buffer).pipe(upload);
    });
  }

  /**
   * Upload a doc & audio file
   * @param file
   * @returns
   */
  uploadFile(file: Express.Multer.File, type: string) {
    // Promise<UploadApiResponse | UploadApiErrorResponse>;

    // console.log(file.buffer.toString());
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.log(error);
            return reject(error);
          }

          const { secure_url } = result;

          resolve({
            [type]: secure_url,
          });
        },
      );

      streamifier.createReadStream(file.buffer).pipe(upload);
    });
  }
}
