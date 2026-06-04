import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
