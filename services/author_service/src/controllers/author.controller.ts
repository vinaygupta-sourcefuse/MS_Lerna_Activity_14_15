import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import {Author} from '../models';
import {AuthorRepository} from '../repositories';

export class AuthorController {
  constructor(
    @repository(AuthorRepository)
    public authorRepository: AuthorRepository,
  ) {}

  @post('/authors')
  @response(200, {
    description: 'Author model instance',
    content: {'application/json': {schema: getModelSchemaRef(Author)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Author, {
            title: 'NewAuthor',
            exclude: ['author_id'], // exclude ID from input
          }),
        },
      },
    })
    author: Omit<Author, 'author_id'>, // type-safe way to enforce it
  ): Promise<Author> {
    return this.authorRepository.create(author);
  }


  @patch('/authors/{id}')
  @response(204, {
    description: 'Category Authors success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Author, {partial: true}),
        },
      },
    })
    category: Author,
  ): Promise<void> {
    await this.authorRepository.updateById(id, category);
  }


  @get('/authors/count')
  @response(200, {
    description: 'Author model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(Author) where?: Where<Author>): Promise<Count> {
    return this.authorRepository.count(where);
  }

  @get('/authors')
  @response(200, {
    description: 'Array of Author model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Author, {includeRelations: true}),
        },
      },
    },
  })
  async find(@param.filter(Author) filter?: Filter<Author>): Promise<Author[]> {
    return this.authorRepository.find(filter);
  }

  @get('/authors/{id}')
  @response(200, {
    description: 'Author model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Author, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Author, {exclude: 'where'})
    filter?: FilterExcludingWhere<Author>,
  ): Promise<Author> {
    return this.authorRepository.findById(id, filter);
  }

  @get('/authors/isbn/{isbn}')
  @response(200, {
    description: 'Author instance by ISBN',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Author, {includeRelations: true}),
      },
    },
  })
  async findByIsbn(@param.path.number('isbn') isbn: number): Promise<Author> {
    const author = await this.authorRepository.findOne({where: {isbn}});
    if (!author) {
      throw new HttpErrors.NotFound(`Author with ISBN ${isbn} not found`);
    }
    return author;
  }

  @del('/authors/{id}')
  @response(204, {
    description: 'Author DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.authorRepository.deleteById(id);
  }
}
