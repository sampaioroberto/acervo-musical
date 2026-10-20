import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {PDFDocument} from 'pdf-lib';
test('downloads exactly one lyric page and four chord pages',async({page})=>{
 await page.goto('/');for(const button of await page.getByRole('button',{name:/^Selecionar /}).all())await button.click();
 await page.getByRole('button',{name:'Gerar PDF'}).click();await expect(page.getByRole('button',{name:'Baixar PDF'})).toBeEnabled();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar PDF'}).click();const file=await download;const doc=await PDFDocument.load(await readFile((await file.path())!));expect(doc.getPageCount()).toBe(1);
 await page.getByRole('button',{name:'Fechar prévia'}).click();page.on('dialog',d=>d.accept());await page.getByRole('button',{name:'Cifras',exact:true}).click();
 for(const button of await page.getByRole('button',{name:/^Selecionar /}).all())await button.click();await page.getByRole('button',{name:'Gerar PDF'}).click();await expect(page.getByRole('button',{name:'Baixar PDF'})).toBeEnabled();const chordDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar PDF'}).click();const chordFile=await chordDownload;expect((await PDFDocument.load(await readFile((await chordFile.path())!))).getPageCount()).toBe(4);
});

