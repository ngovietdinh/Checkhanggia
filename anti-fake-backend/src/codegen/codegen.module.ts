import { Module } from '@nestjs/common';
import { CodegenService } from './codegen.service';
import { CodegenController } from './codegen.controller';

@Module({
  controllers: [CodegenController],
  providers: [CodegenService],
})
export class CodegenModule {}
