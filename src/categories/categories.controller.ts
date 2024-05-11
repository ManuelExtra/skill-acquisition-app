import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from 'src/auth/decorators/auth.decorator';
import { Roles } from 'src/auth/decorators/role.decorator';
import { IdDto } from 'src/generic/dto/generic.dto';
import { GenericPayload, PagePayload } from 'src/generic/generic.payload';
import { GenericFilter } from 'src/generic/pagination/generic-filter';
import { UserRole } from 'src/users/entities/user.entity';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Categories, ICategory } from './entities/categories.entity';

@Controller('v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Create category endpoint
   * @param createCategoryDto
   * @returns
   */
  @Post('create')
  @Roles(UserRole.ADMIN)
  create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<GenericPayload> {
    return this.categoriesService.create(createCategoryDto);
  }

  /**
   * View categories endpoint
   * @param filter
   * @returns
   */
  @Get()
  @Roles(UserRole.ADMIN)
  findAll(
    @Query() filter: GenericFilter & ICategory,
  ): Promise<PagePayload<Categories>> {
    return this.categoriesService.findAll(filter);
  }

  /**
   * View categories endpoint (client)
   * @param filter
   * @returns
   */
  @Get('fetch-categories')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR)
  fetchCategories(
    @Query() filter: GenericFilter & ICategory,
  ): Promise<PagePayload<Categories>> {
    return this.categoriesService.fetchCategories(filter);
  }

  /**
   * View categoies endpoint
   * @param filter
   * @returns
   */
  @Get('public')
  @Public()
  findAllPublic(
    @Query() filter: GenericFilter & ICategory,
  ): Promise<PagePayload<Categories>> {
    return this.categoriesService.findAllPublic(filter);
  }

  /**
   * View category endpoint by id
   * @param categoryIdDto
   * @returns
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param() categoryIdDto: IdDto): Promise<Categories | null> {
    return this.categoriesService.findOne(categoryIdDto['id']);
  }

  /**
   * Update category endpoint
   * @param categoryIdDto
   * @param updateCategoryDto
   * @returns
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param() categoryIdDto: IdDto,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(categoryIdDto, updateCategoryDto);
  }

  /**
   * Delete category endpoint
   * @param categoryIdDto
   * @returns
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param() categoryIdDto: IdDto) {
    return this.categoriesService.remove(categoryIdDto);
  }
}
