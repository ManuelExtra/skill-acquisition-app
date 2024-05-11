import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IdDto } from 'src/generic/dto/generic.dto';
import { GenericPayload, PagePayload } from 'src/generic/generic.payload';
import { GenericFilter } from 'src/generic/pagination/generic-filter';
import { PageService } from 'src/generic/pagination/page.service';
import { Like, Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Categories, ICategory } from './entities/categories.entity';

@Injectable()
export class CategoriesService extends PageService {
  constructor(
    @InjectRepository(Categories)
    private categoriesRepository: Repository<Categories>,
    private readonly categories: Categories,
  ) {
    super();
  }

  /**
   * A private method for creating a category where query
   * @param params
   * @returns
   */
  private createCategoryWhereQuery(params: ICategory) {
    const where: any = {};

    if (params.title) {
      where.title = Like(`%${params.title}%`);
    }

    if (params.published) {
      where.isPublished = Boolean(+params.published);
    }

    return where;
  }

  /**
   * Create category
   * @param createCategoryDto
   * @returns
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<GenericPayload> {
    const { title } = createCategoryDto;

    const category = this.categories.create(createCategoryDto);

    // Check category by title
    const savedCategory = await this.categoriesRepository.findOne({
      where: { title },
    });

    if (savedCategory) {
      throw new UnprocessableEntityException(
        `Category with this title '${title}' already exists.`,
      );
    }

    await this.categoriesRepository.save(category);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Category created successfully',
    };
  }

  /**
   * View categories (with pagination)
   * @param filter
   * @returns
   */
  async findAll(
    filter: GenericFilter & ICategory,
  ): Promise<PagePayload<Categories>> {
    const { ...params } = filter;

    const [results, total] = await this.paginate(
      this.categoriesRepository,
      filter,
      this.createCategoryWhereQuery(params),
    );
    return {
      data: results,
      count: total,
    };
  }

  /**
   * View categories (with pagination) | fetch for clients
   * @param filter
   * @returns
   */
  async fetchCategories(
    filter: GenericFilter & ICategory,
  ): Promise<PagePayload<Categories>> {
    const { ...params } = filter;

    const where = {
      ...this.createCategoryWhereQuery(params),
      isPublished: true,
    };

    const [results, total] = await this.paginateWithSelect(
      this.categoriesRepository,
      filter,
      where,
      ['id', 'title'],
    );

    return {
      data: results,
      count: total,
    };
  }

  /**
   * View categories public (with pagination)
   * @param filter
   * @returns
   */
  async findAllPublic(
    filter: GenericFilter & ICategory,
  ): Promise<PagePayload<Categories>> {
    const { ...params } = filter;

    const relations = {
      courses: true,
    };

    const where = {
      ...this.createCategoryWhereQuery(params),
      isPublished: true,
      courses: {
        isPublished: true,
      },
    };

    // Specify page size
    filter.pageSize = 6;

    const [results, total] = await this.paginateRel(
      this.categoriesRepository,
      filter,
      where,
      relations,
    );
    return {
      data: results,
      count: total,
    };
  }

  /**
   * View category with id
   * @param id
   * @returns
   */
  async findOne(id: IdDto['id']): Promise<Categories | null> {
    const category = await this.categoriesRepository.findOneBy({ id });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  /**
   * Update category
   * @param categoryIdDto
   * @param updateCategoryDto
   * @returns
   */
  async update(
    categoryIdDto: IdDto,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<GenericPayload> {
    const { id } = categoryIdDto;

    // Check category
    const category = await this.findOne(id);

    Object.keys(updateCategoryDto).forEach((item) => {
      category[item] = updateCategoryDto[item];
    });

    await this.categoriesRepository.save(category);

    return {
      statusCode: HttpStatus.OK,
      message: 'Category updated successfully.',
    };
  }

  /**
   * Delete category (only unpublished ones)
   * @param categoryIdDto
   * @returns
   */
  async remove(categoryIdDto: IdDto): Promise<GenericPayload> {
    const { id } = categoryIdDto;
    const category = await this.findOne(id);

    if (category.isPublished) {
      throw new UnprocessableEntityException(
        'Category published cannot be deleted.',
      );
    }

    await this.categoriesRepository.delete({ id });

    return {
      statusCode: HttpStatus.OK,
      message: 'Category removed successfully.',
    };
  }
}
