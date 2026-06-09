import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

import { SearchController } from './presentation/controllers/search.controller';
import { SearchService } from './search.service';

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
