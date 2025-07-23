import { AnalysisResult, FunctionInfo, ClassInfo } from './analyzer';

export class MarkdownFormatter {
  public format(result: AnalysisResult, sourceFilePath: string): string {
    const lines: string[] = [];

    lines.push(`# Context Card for ${sourceFilePath}`);
    lines.push('');
    lines.push('This document provides a high-level overview of the code structure, including key functions and classes, to help developers quickly understand the module\'s purpose and public API.');
    lines.push('');

    if (result.classes.length > 0) {
      lines.push('## Classes');
      lines.push('');
      result.classes.forEach(classInfo => {
        lines.push(...this.formatClass(classInfo));
      });
    }

    if (result.functions.length > 0) {
      lines.push('## Functions');
      lines.push('');
      result.functions.forEach(funcInfo => {
        lines.push(...this.formatFunction(funcInfo));
      });
    }

    return lines.join('\n');
  }

  private formatClass(classInfo: ClassInfo): string[] {
    const lines: string[] = [];
    lines.push(`### \`class ${classInfo.name}\``);
    lines.push('');
    if (classInfo.summary) {
      lines.push(`**Summary:** ${classInfo.summary}`);
      lines.push('');
    }
    lines.push(`**Signature:** \`${classInfo.signature}\``);
    lines.push('');

    if (classInfo.methods.length > 0) {
      lines.push('**Methods:**');
      lines.push('');
      classInfo.methods.forEach(method => {
        lines.push(...this.formatMethod(method));
      });
    }

    if (classInfo.dependencies.length > 0) {
      lines.push(`**Dependencies:**`);
      lines.push('');
      classInfo.dependencies.forEach(dep => {
        lines.push(`- \`${dep}\``);
      });
      lines.push('');
    }
    
    lines.push('---');
    lines.push('');
    return lines;
  }

  private formatFunction(funcInfo: FunctionInfo): string[] {
    const lines: string[] = [];
    lines.push(`### \`${funcInfo.name}\``);
    lines.push('');
    if (funcInfo.summary) {
      lines.push(`**Summary:** ${funcInfo.summary}`);
      lines.push('');
    }
    lines.push(`**Signature:** \`${funcInfo.signature}\``);
    lines.push('');

    if (funcInfo.dependencies.length > 0) {
      lines.push(`**Dependencies:**`);
      lines.push('');
      funcInfo.dependencies.forEach(dep => {
        lines.push(`- \`${dep}\``);
      });
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    return lines;
  }

  private formatMethod(methodInfo: FunctionInfo): string[] {
    const lines: string[] = [];
    lines.push(`- **\`${methodInfo.name}\`**`);
    if (methodInfo.summary) {
      lines.push(`  - **Summary:** ${methodInfo.summary}`);
    }
    lines.push(`  - **Signature:** \`${methodInfo.signature}\``);
    if (methodInfo.dependencies.length > 0) {
      lines.push(`  - **Dependencies:** ${methodInfo.dependencies.map(d => `\`${d}\``).join(', ')}`);
    }
    lines.push('');
    return lines;
  }
}