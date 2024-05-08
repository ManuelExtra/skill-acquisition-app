import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthPayload } from 'src/auth/entities/auth.entity';
import { IdDto } from 'src/generic/dto/generic.dto';
import { GenericPayload } from 'src/generic/generic.payload';
import { OrdersService } from 'src/orders/orders.service';
import { Repository } from 'typeorm';
import { CreateCourseReadRecordDto } from './dto/create-course-read-record.dto';
import { CourseReads } from './entities/course-reads.entity';

@Injectable()
export class ReadsService {
  constructor(
    @InjectRepository(CourseReads)
    private readonly courseReadsRepository: Repository<CourseReads>,
    private readonly courseReads: CourseReads,
  ) {}

  /**
   * Fetch course reads
   * @param courseId
   * @param studentId
   * @returns
   */
  async fetchCourseReads(
    courseId: string,
    studentId: string,
  ): Promise<CourseReads[]> {
    // Fetch course reads
    const courseReads = await this.courseReadsRepository.find({
      where: {
        // @ts-ignore
        contentSub: { course: { id: courseId } },
        // @ts-ignore
        student: { id: studentId },
      },
      relations: ['contentSub'],
    });

    return courseReads;
  }

  /**
   * Fetch course reads number
   * @param courseId
   * @param studentId
   * @returns
   */
  async courseReadsNumber(
    courseId: string,
    studentId?: string | undefined,
  ): Promise<number> {
    const where = {
      // @ts-ignore
      contentSub: { course: { id: courseId } },
    };
    if (studentId) {
      // @ts-ignore
      where.student = { id: studentId };
    }

    // Fetch course reads
    const courseReads = await this.courseReadsRepository.count({
      // @ts-ignore
      where,
      relations: ['contentSub'],
    });

    return courseReads;
  }

  /**
   * Create a course read record
   * @param userDto
   * @param createCourseReadRecordDto
   * @returns
   */
  async createCourseReadRecord(
    courseRequestId: string,
    userDto: AuthPayload['user'],
    createCourseReadRecordDto: CreateCourseReadRecordDto,
  ): Promise<GenericPayload> {
    const { courseContentSub } = createCourseReadRecordDto;

    // Check course read existence
    const courseRead = await this.courseReadsRepository.findOne({
      where: {
        // @ts-ignore
        contentSub: { id: courseContentSub },
        // @ts-ignore
        student: { id: userDto.sub },
      },
    });

    if (courseRead) {
      throw new BadRequestException('Course read record already exists.');
    }

    // Prepare course read record for storage
    const newCourseRead = this.courseReads.create(
      createCourseReadRecordDto,
      userDto.sub as IdDto['id'],
    );

    // Store course read record
    await this.courseReadsRepository.insert(newCourseRead);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Course read record created successfully',
    };
  }
}
