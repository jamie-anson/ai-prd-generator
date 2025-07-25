import Parser from 'tree-sitter';
import { CodeEnricher } from './enricher';
import { OpenAiService } from '../utils/openai';
const TypeScript = require('tree-sitter-typescript');

/**
 * Represents the extracted information for a function or method.
 */
export interface FunctionInfo {
  name: string;
  signature: string;
  summary?: string;
  dependencies: string[];
}

/**
 * Represents the extracted information for a class.
 */
export interface ClassInfo {
  name: string;
  signature: string;
  methods: FunctionInfo[];
  summary?: string;
  dependencies: string[];
}

/**
 * The result of a code analysis.
 */
export interface AnalysisResult {
  functions: FunctionInfo[];
  classes: ClassInfo[];
}

/**
 * Analyzes source code using tree-sitter to extract structural information.
 */
export class CodeAnalyzer {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(TypeScript.typescript);
  }

  public analyze(sourceCode: string): AnalysisResult {
    try {
      const tree = this.parser.parse(sourceCode);
      const rootNode = tree.rootNode;

      const functionsWithNodes = this.findFunctions(rootNode);
      const classesWithNodes = this.findClasses(rootNode);

    const result: AnalysisResult = {
      functions: functionsWithNodes.map(([info]) => info),
      classes: classesWithNodes.map(([info]) => info),
    };

      this.analyzeDependencies(functionsWithNodes, classesWithNodes);

      return result;
    } catch (error) {
      console.error('Tree-sitter parsing error:', error);
      // Return empty result if parsing fails
      return {
        functions: [],
        classes: []
      };
    }
  }

  private findFunctions(node: Parser.SyntaxNode): [FunctionInfo, Parser.SyntaxNode][] {
    const functions: [FunctionInfo, Parser.SyntaxNode][] = [];
    const seenNodes = new Set<number>();
    const query = new Parser.Query(TypeScript.typescript, `
      [
        (function_declaration)
        (export_statement (function_declaration))
      ] @declaration
    `);
    const matches = query.matches(node);

    for (const match of matches) {
      let declarationNode = match.captures[0].node;
      // If it's an export statement, we need to get the actual declaration node inside it
      if (declarationNode.type === 'export_statement') {
        declarationNode = declarationNode.firstNamedChild!;
      }

      if (seenNodes.has(declarationNode.startIndex)) {
        continue;
      }
      seenNodes.add(declarationNode.startIndex);

      const nameNode = declarationNode.childForFieldName('name');

      if (nameNode) {
        functions.push([
          { name: nameNode.text, signature: this.getSignature(declarationNode, 'body'), dependencies: [] },
          declarationNode
        ]);
      }
    }
    return functions;
  }

  private findClasses(node: Parser.SyntaxNode): [ClassInfo, Parser.SyntaxNode][] {
    const classes: [ClassInfo, Parser.SyntaxNode][] = [];
    const seenNodes = new Set<number>();
    const query = new Parser.Query(TypeScript.typescript, `
      [
        (class_declaration)
        (export_statement (class_declaration))
      ] @declaration
    `);
    const matches = query.matches(node);

    for (const match of matches) {
      let declarationNode = match.captures[0].node;
      // If it's an export statement, we need to get the actual declaration node inside it
      if (declarationNode.type === 'export_statement') {
        declarationNode = declarationNode.firstNamedChild!;
      }

      if (seenNodes.has(declarationNode.startIndex)) {
        continue;
      }
      seenNodes.add(declarationNode.startIndex);

      const nameNode = declarationNode.childForFieldName('name');

      if (nameNode) {
        classes.push([
          {
            name: nameNode.text,
            signature: this.getSignature(declarationNode, 'body'),
            methods: this.findMethodsInClass(declarationNode).map(([info]) => info),
            dependencies: [],
          },
          declarationNode,
        ]);
      }
    }
    return classes;
  }

  private findMethodsInClass(classNode: Parser.SyntaxNode): [FunctionInfo, Parser.SyntaxNode][] {
    const methods: [FunctionInfo, Parser.SyntaxNode][] = [];
    const bodyNode = classNode.children.find(c => c.type === 'class_body');
    if (!bodyNode) {return [];}

    const methodQuery = new Parser.Query(TypeScript.typescript, `(method_definition) @declaration`);
    const matches = methodQuery.matches(bodyNode);

    for (const match of matches) {
      const declarationNode = match.captures[0].node;
      const nameNode = declarationNode.childForFieldName('name');

      if (nameNode) {
        methods.push([
          { name: nameNode.text, signature: this.getSignature(declarationNode, 'body'), dependencies: [] },
          declarationNode
        ]);
      }
    }
    return methods;
  }

  private analyzeDependencies(
    functionsWithNodes: [FunctionInfo, Parser.SyntaxNode][],
    classesWithNodes: [ClassInfo, Parser.SyntaxNode][]
  ): void {
    const knownSymbols = new Set([
      ...functionsWithNodes.map(([{ name }]) => name),
      ...classesWithNodes.map(([{ name }]) => name),
    ]);

    const allFunctionsAndMethods: [FunctionInfo, Parser.SyntaxNode][] = [...functionsWithNodes];

    for (const [classInfo, classNode] of classesWithNodes) {
      const classBody = classNode.childForFieldName('body');
      if (classBody) {
        const methodsWithNodes = this.findMethodsInClass(classBody);
        for (const [methodInfo, methodNode] of methodsWithNodes) {
            // @intent: Find the original method object in classInfo to add dependencies
            // @why: Ensures that method dependency information is accurately associated with the correct method in the class summary
            const originalMethod = classInfo.methods.find(m => m.name === methodInfo.name);
            if (originalMethod) {
                allFunctionsAndMethods.push([originalMethod, methodNode]);
            }
        }
      }
    }

    for (const [funcInfo, funcNode] of allFunctionsAndMethods) {
      const query = new Parser.Query(TypeScript.typescript, `
        (call_expression
          function: (identifier) @callName)
      `);

      const matches = query.matches(funcNode);

      for (const match of matches) {
        const callName = match.captures[0].node.text;
        if (callName === funcInfo.name) { continue; } // Skip self-references

        if (knownSymbols.has(callName)) {
          if (!funcInfo.dependencies.includes(callName)) {
            funcInfo.dependencies.push(callName);
          }
        }
      }
    }
  }

  private getSignature(node: Parser.SyntaxNode, bodyFieldName: string): string {
    const bodyNode = node.children.find(child => child.type === 'class_body' || child.type === 'statement_block');

    if (bodyNode) {
      const signatureEnd = bodyNode.startIndex;
      const fullText = node.text;
      const signatureText = fullText.substring(0, signatureEnd - node.startIndex).trim();
      return signatureText.includes('class') ? `${signatureText} { ... }` : signatureText;
    }
    return node.text;
  }
}

// @intent: Provide a test harness to run the analyzer directly from the command line
// @why: Allows developers to test the analyzer logic in isolation without integrating into the extension
async function runTest() {
  // This check ensures the test code only runs when the file is executed directly
  if (process.argv[1] && (process.argv[1].endsWith('analyzer.ts') || process.argv[1].endsWith('analyzer.js') || process.argv[1].endsWith('analyzer-test.js'))) {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
      const filePath = path.join(__dirname, '..', 'extension.ts');
      console.log(`Analyzing file: ${filePath}`);
      const sourceCode = await fs.readFile(filePath, 'utf8');
      
      const analyzer = new CodeAnalyzer();
      let result = analyzer.analyze(sourceCode);

      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        console.log('--- Enriching analysis with summaries ---');
                const openAiService = new OpenAiService(apiKey);
        const enricher = new CodeEnricher(openAiService);
        result = await enricher.enrich(result, '');
      } else {
        // @intent: Log and skip enrichment step if OPENAI_API_KEY is not set
        // @why: Prevents errors when API key is missing and makes test output clear
      }

      console.log('--- Final Result ---');
      console.log(JSON.stringify(result, null, 2));
      console.log('--------------------');

    } catch (error) {
      // @intent: Log errors that occur during the analyzer test run for debugging purposes
    }
  }
}

// runTest();
