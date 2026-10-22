

import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import * as cheerio from 'cheerio';
import { readImageTool } from './tools.js'
import { Document } from "@langchain/core/documents";
import "dotenv/config";
/**
 * HELPER: Converts HTML tables to Markdown format for better embedding semantic alignment
//  */
// export function tableToMarkdown($el, $) {
//     const rows = [];
//     $el.find('tr').each((_, tr) => {
//         const cells = [];
//         $(tr).find('th, td').each((_, td) => {
//             // Clean text and escape pipe characters
//             cells.push($(td).text().trim().replace(/\|/g, '\\|'));
//         });
//         if (cells.length > 0) {
//             rows.push(`| ${cells.join(' | ')} |`);
//         }
//     });

//     if (rows.length > 0) {
//         // Create the Markdown header separator line (e.g., |---|---|)
//         const cellCount = rows[0].split('|').length - 2;
//         const separator = `| ${Array(cellCount).fill('---').join(' | ')} |`;
//         rows.splice(1, 0, separator);
//     }
//     return rows.join('\n');
// }




export const formatDocumentsAsString = (documents) => {
    return documents.map((doc) => doc?.pageContent).join("\n\n");
};

async function generateImageDocs(images = []) {
    const docPromises = images.map(async (img) => {
        try {
            const { success, summary } = await readImageTool.invoke({ imageUrl: img });

            if (success && summary) {
                return new Document({
                    pageContent: summary,
                    metadata: {
                        imageURL: img,
                        docType: "imageSummary",
                    }
                });
            }
            return null;
        } catch (error) {
            console.error("Error generating image summary:", error);
            return null;
        }
    });

    const results = await Promise.all(docPromises);
    return results.filter(doc => doc !== null);
}




export async function loadRawDocsWithImagesAndTables(urls = []) {
    const allDocs = await Promise.all(
        urls.map(async (url) => {
            // Load text content
            const loader = new CheerioWebBaseLoader(url);
            const docs = await loader.load();

            // Fetch RAW HTML for images and tables
            const htmlRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = await htmlRes.text();
            const $ = cheerio.load(html);


            // --- EXTRACT IMAGE URLS ---
            const imageUrls = [];
            $('img').each((_, elem) => {
                let src = $(elem).attr('src') || $(elem).attr('data-src') || $(elem).attr('data-lazy-src');
                if (!src && $(elem).attr('srcset')) {
                    src = $(elem).attr('srcset').split(',')[0].split(' ')[0];
                }
                if (!src) return;
                if (src.startsWith('//')) src = 'https:' + src;
                try {
                    imageUrls.push(new URL(src, url).href);
                } catch (_) { }
            });



            return { docs, imageUrls }

        })
    );

    const flattenDocument = allDocs.flat()
    const documents = flattenDocument[0]?.docs?.flat()
    const images = flattenDocument[0]?.imageUrls
    const imageSummaries = await generateImageDocs(images)

    return {
        documents,
        imageSummaries
    }

}

