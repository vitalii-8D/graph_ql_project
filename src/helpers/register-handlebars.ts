import { NestExpressApplication } from '@nestjs/platform-express';
import hbs from 'hbs';
import { join } from 'path';

const viewsPath = join(process.cwd(), 'views');

export const registerHbs = (app: NestExpressApplication) => {
  app.setBaseViewsDir(viewsPath);
  app.setViewEngine('hbs');

  hbs.registerPartials(join(viewsPath, 'partials'));

  hbs.registerHelper('formatDate', (date: Date | string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB');
  });

  hbs.registerHelper('truncate', (text: string, length: number) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) : text;
  });

  hbs.registerHelper('encodeURIComponent', (str: string) => {
    return encodeURIComponent(str || '');
  });

  hbs.registerHelper('removeAt', (str: string) => {
    if (!str) return '';
    return str.replace('@', '');
  });

  hbs.registerHelper('joinTags', (tags: string[]) => {
    if (!tags || !Array.isArray(tags)) return '';
    return encodeURIComponent(tags.slice(0, 2).join(','));
  });

  hbs.registerHelper('eq', (a: any, b: any) => {
    return a === b;
  });
};
