import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';
import { SearchController } from './presentation/controllers/search.controller';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        node: config.get('ELASTICSEARCH_URL', 'http://localhost:9200'),
        auth: config.get('ELASTICSEARCH_USERNAME')
          ? { username: config.get('ELASTICSEARCH_USERNAME', ''), password: config.get('ELASTICSEARCH_PASSWORD', '') }
          : undefined,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
