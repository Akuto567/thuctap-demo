export interface WordSearchItem {
  id: string;
  image: string;
  keyword: string;
}

export interface WordSearchConfig {
  items: WordSearchItem[];
  background?: string;
}
