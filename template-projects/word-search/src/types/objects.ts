export interface WordSearchItem {
  id: string;
  image: string;
  word: string;
}

export interface WordSearchConfig {
  items: WordSearchItem[];
  background?: string;
}
