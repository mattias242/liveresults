import { LiveResultsApi } from '../api/client';

export interface ClassesUpdate {
  changed: boolean;
  classes: string[];
  error?: string;
}

/** Polls the class list for a competition, reusing cached names on NOT MODIFIED. */
export class ClassesController {
  private lastHash?: string;
  private classes: string[] = [];

  constructor(
    private readonly api: LiveResultsApi,
    private readonly comp: number,
  ) {}

  async refresh(): Promise<ClassesUpdate> {
    const res = await this.api.getClasses(this.comp, this.lastHash);
    if (res.status === 'notModified') {
      return { changed: false, classes: this.classes };
    }
    if (res.status === 'error') {
      return { changed: false, classes: this.classes, error: res.message };
    }
    this.classes = res.data.map((c) => c.className);
    this.lastHash = res.hash;
    return { changed: true, classes: this.classes };
  }

  currentClasses(): string[] {
    return this.classes;
  }
}
