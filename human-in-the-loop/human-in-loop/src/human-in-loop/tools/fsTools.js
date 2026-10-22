import fs from "fs";
import path from "path";
import { tool } from "@langchain/core/tools";
import { z } from "zod";


const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "public", "deep-agent");

export const write_file = tool(
    async ({ filename, content }) => {
        try {
            // Resolve absolute path inside your project
            const fullPath = path.join(BASE_DIR, filename);

            // Ensure directory exists
            await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });

            // Write file (overwrite if exists)
            await fs.promises.writeFile(fullPath, content, "utf8");

           

            return JSON.stringify({
                message: `Successfully wrote to   ${filename} characters :${content.length} `
            })

        } catch (error) {
            return `Error writing file: ${error.message}`;
        }
    },
    {
    name: "write_file",
    description: `
Create or overwrite a file inside the project workspace.

This tool writes text content to a file. If the file already exists, it will be completely overwritten with the new content.

PATH USAGE:
- You may provide either:
  1. A full relative path with folders (recommended)
     Example: "reports/analysis.md"
     Example: "src/utils/helpers.ts"
     Example: "docs/setup/installation.md"

  2. Only a filename
     Example: "notes.md"
     Example: "todo.txt"

If only a filename is provided, the file will be created in the project root directory.

DIRECTORY HANDLING:
- If the specified directories do not exist, they will automatically be created.
- Nested folders are supported.

FILE BEHAVIOR:
- The file will be written using UTF-8 encoding.
- Existing files will be replaced entirely.
- This tool is intended for generating project files, reports, documentation, source code, or configuration files.

WHEN TO USE:
Use this tool whenever you need to:
- Create a new file
- Save generated code
- Write reports or research results
- Persist markdown notes or documentation
- Export generated project files

WHEN NOT TO USE:
- Do not use this tool to append content to an existing file (it overwrites files).
- Do not use this tool for binary files (images, videos, compiled artifacts).

BEST PRACTICES:
- Always include the correct file extension (.md, .ts, .json, .py, etc.)
- Prefer structured project paths like "src/", "docs/", "reports/", etc.
- Ensure the content is complete and properly formatted before writing.

Example Calls:

Create a markdown report:
filename: "reports/market_research.md"

Create a source code file:
filename: "src/app/server.ts"

Create a simple root file:
filename: "README.md"
`,
    schema: z.object({
        filename: z.string().describe(
            "Target file path or filename. Can be a simple filename (e.g., 'report.md') or a relative path (e.g., 'docs/report.md' or 'src/app.ts')."
        ),
        content: z.string().describe(
            "The full text content that will be written into the file."
        ),
    }),
}
);





export const delete_file = tool(
  async ({ filename }) => {
    try {
      const fullPath = path.resolve(BASE_DIR, filename);

      // Prevent path escaping outside BASE_DIR
      if (!fullPath.startsWith(BASE_DIR)) {
        throw new Error("Invalid path: outside workspace");
      }

      // Prevent deleting files inside the skills folder
      const skillsPath = path.join(BASE_DIR, "skills");

      if (fullPath.startsWith(skillsPath)) {
        throw new Error(
          "Deletion blocked: files inside the 'skills' folder cannot be deleted."
        );
      }

      // Check if file exists
      await fs.promises.access(fullPath);

      // Delete file
      await fs.promises.unlink(fullPath);



      return JSON.stringify({
        message: `File successfully deleted: ${filename}`,
      });

    } catch (error) {
      if (error.code === "ENOENT") {
        return `File not found: ${filename}`;
      }

      return `Error deleting file: ${error.message}`;
    }
  },
  {
    name: "delete_file",
    description: `
Delete a file inside the project workspace.

This tool permanently removes a file from the agent workspace directory.

IMPORTANT RESTRICTIONS:
- Files inside the "skills" directory CANNOT be deleted.
- Any attempt to delete a file inside "skills/" will be blocked.

PATH USAGE:
You may provide either:

1. Full relative path
Example:
"reports/analysis.md"
"src/utils/helpers.ts"

2. Filename only
Example:
"notes.md"
"todo.txt"

If only a filename is provided, the file will be assumed to exist in the project root.

FILE BEHAVIOR:
- The file will be permanently deleted.
- This action cannot be undone.
- If the file does not exist, the tool will return a message indicating it was not found.

WHEN TO USE:
Use this tool when you need to:
- Remove outdated files
- Delete temporary outputs
- Clean up generated artifacts
- Remove incorrect reports or code

WHEN NOT TO USE:
- Do not use this tool for directories.
- Do not attempt to delete files inside the "skills" folder.

BEST PRACTICES:
- Double check filenames before deletion.
- Only delete files generated during the current task.
`,
    schema: z.object({
      filename: z.string().describe(
        "Target file path or filename to delete. Example: 'reports/report.md' or 'notes.md'."
      ),
    }),
  }
);

export const read_file = tool(
  async ({ filename, offset = 0, limit = 100 }) => {
    try {
      const resolvedPath = path.resolve(BASE_DIR, filename);

      // 🔒 Prevent directory traversal
      if (!resolvedPath.startsWith(BASE_DIR)) {
        throw new Error("Access outside allowed directory is not permitted.");
      }

      const content = await fs.promises.readFile(resolvedPath, "utf8");
      const lines = content.split("\n");

      const slice = lines.slice(offset, offset + limit);

      const formatted = slice
        .map((line, i) => `${(offset + i + 1).toString().padStart(4)} | ${line}`)
        .join("\n");

  
        

      // Check if more lines exist
      if (offset + limit < lines.length) {
        const remaining = lines.length - (offset + limit);
        return `${formatted}\n\n[... ${remaining} more lines. Use offset=${offset + limit} to continue reading ...]`;
      }

      return `${formatted}`;
    } catch (error) {
      return `Error reading file: ${error.message}`;
    }
  },
  {
    name: "read_file",
    description: `
Read the contents of a file inside the project root and return it with line numbers, supporting streaming/pagination.

- Use offset and limit to read in chunks.
- Returns continuation hint if more lines remain.
- Each line is prefixed with its number.
- Works with toolConfig.writer to stream content.
`,
    schema: z.object({
      filename: z.string().describe("Filename to read relative to project root"),
      offset: z.number().optional().default(0),
      limit: z.number().optional().default(100),
    }),
  }
);

export const filesystemTools = [write_file,delete_file,read_file]

