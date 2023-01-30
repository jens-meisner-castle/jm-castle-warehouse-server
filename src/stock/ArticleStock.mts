import {
  ArticleStockState,
  Row_Article,
  Row_Emission,
  Row_Receipt,
  Row_StoreSection,
  SectionStockState,
} from "jm-castle-warehouse-types";
import { DateTime } from "luxon";
import { CastleWarehouse } from "../index.js";

type SectionStock = Record<
  string,
  { article: Row_Article; base: number; receipt: number; emitted: number }
>;

export class ArticleStock {
  private system: CastleWarehouse;
  private storeSections: Row_StoreSection[];
  private storeSectionHash: Record<string, Row_StoreSection> = {};
  private sectionStock: Record<string, SectionStock> = {};

  constructor(system: CastleWarehouse) {
    this.system = system;
  }

  private structureForSectionAndArticle = (
    sectionId: string,
    articleId: string
  ) => {
    const stock = this.sectionStock[sectionId];
    if (!stock) return undefined;
    return stock[articleId];
  };

  private getStructureForSectionAndArticle = (
    sectionId: string,
    article: Row_Article
  ) => {
    const stock = this.sectionStock[sectionId];
    if (!stock) return undefined;
    let perArticle = stock[article.article_id];
    if (!perArticle) {
      perArticle = { article, base: 0, receipt: 0, emitted: 0 };
      stock[article.article_id] = perArticle;
    }
    return perArticle;
  };

  private initStoreSections = async () => {
    const { result: sectionResult, error: sectionError } = await this.system
      .getDefaultPersistence()
      .tables.storeSection.all();
    if (sectionError) throw new Error(sectionError);
    const { rows: sectionRows } = sectionResult || {};
    this.storeSections = sectionRows;
    this.storeSections.forEach((section) => {
      this.storeSectionHash[section.section_id] = section;
      this.sectionStock[section.section_id] = {};
    });
  };

  private initSectionStock = async () => {
    const at_from = Math.floor(
      DateTime.fromFormat("2000-01-01", "yyyy-LL-dd").toMillis() / 1000
    );
    const at_to = Math.ceil(
      DateTime.now().plus({ hours: 2 }).toMillis() / 1000
    );
    const { result: articleResult, error: articleError } = await this.system
      .getDefaultPersistence()
      .tables.article.all();
    if (articleError) throw new Error(articleError);
    const { rows: articleRows } = articleResult;
    const articleHash: Record<string, Row_Article> = {};
    articleRows.forEach(
      (article) => (articleHash[article.article_id] = article)
    );
    // todo: stock state (temporary)

    // Wareneingang
    const { result: receiptResult, error: receiptError } = await this.system
      .getDefaultPersistence()
      .tables.receipt.selectGroupBy(
        { at_from, at_to },
        ["section_id", "article_id"],
        [{ col: "article_count", fn: "sum" }]
      );
    if (receiptError) throw new Error(receiptError);
    const { rows: receiptRows } = receiptResult;
    // Warenausgang
    const { result: emissionResult, error: emissionError } = await this.system
      .getDefaultPersistence()
      .tables.emission.selectGroupBy(
        { at_from, at_to },
        ["section_id", "article_id"],
        [{ col: "article_count", fn: "sum" }]
      );
    if (emissionError) throw new Error(emissionError);
    const { rows: emissionRows } = emissionResult;
    // Bestand: stock state + neuer Eingang - neuer Ausgang
    receiptRows.forEach((receipt) => {
      const article = articleHash[receipt.article_id];
      const perArticle =
        article &&
        this.getStructureForSectionAndArticle(receipt.section_id, article);
      perArticle &&
        (perArticle.receipt = perArticle.receipt + receipt.article_count);
    });
    emissionRows.forEach((emission) => {
      const article = articleHash[emission.article_id];
      const perArticle =
        article &&
        this.getStructureForSectionAndArticle(emission.section_id, article);
      perArticle &&
        (perArticle.emitted = perArticle.emitted + emission.article_count);
    });
  };

  public initFromSystem = async () => {
    await this.initStoreSections();
    await this.initSectionStock();
  };

  public stockStateForArticle = async (
    article: Row_Article
  ): Promise<ArticleStockState> => {
    const result: ArticleStockState = { article, states: [] };
    Object.keys(this.sectionStock).forEach((k) => {
      const section = this.storeSectionHash[k];
      if (section) {
        const perArticle = this.structureForSectionAndArticle(
          k,
          article.article_id
        );
        if (perArticle) {
          const { base, emitted, receipt } = perArticle;
          const physicalCount = base + receipt - emitted;
          result.states.push({
            section,
            physicalCount,
            availableCount: physicalCount,
          });
        }
      }
    });
    return result;
  };

  public stockStateForAllStoreSections = async () => {
    const result: Record<string, SectionStockState> = {};
    Object.keys(this.sectionStock).forEach((sectionId) => {
      const section = this.storeSectionHash[sectionId];
      const states: SectionStockState["states"] = [];
      const stock = this.sectionStock[sectionId];
      Object.keys(stock).forEach((articleId) => {
        const { article, base, emitted, receipt } = stock[articleId];
        const physicalCount = base + receipt - emitted;
        states.push({ article, physicalCount, availableCount: physicalCount });
      });
      result[sectionId] = { section, states };
    });
    return result;
  };

  public stockStateForAllArticles = async () => {
    const result: Record<string, ArticleStockState> = {};
    Object.keys(this.sectionStock).forEach((sectionId) => {
      const section = this.storeSectionHash[sectionId];
      const stock = this.sectionStock[sectionId];
      Object.keys(stock).forEach((articleId) => {
        const { article, base, emitted, receipt } = stock[articleId];
        const existing = result[articleId];
        let states: ArticleStockState["states"] = [];
        if (existing) {
          states = existing.states;
        } else {
          result[articleId] = { article, states };
        }
        const physicalCount = base + receipt - emitted;
        states.push({ section, physicalCount, availableCount: physicalCount });
      });
    });
    return result;
  };

  public updateNewStoreSection = async (row: Row_StoreSection) => {
    this.storeSections = [...this.storeSections, row];
    this.storeSectionHash[row.section_id] = row;
    this.sectionStock[row.section_id] = {};
  };

  public updateChangedStoreSection = async (row: Row_StoreSection) => {
    const index = this.storeSections.findIndex(
      (section) => section.section_id === row.section_id
    );
    if (index < 0) {
      this.storeSections = [...this.storeSections, row];
    } else {
      this.storeSections = [
        ...this.storeSections.slice(0, index),
        row,
        ...this.storeSections.slice(
          index,
          Math.min(index + 1, this.storeSections.length - 1)
        ),
      ];
    }
    this.storeSectionHash[row.section_id] = row;
  };

  public updateChangedArticle = async (row: Row_Article) => {
    Object.keys(this.sectionStock).forEach((sectionId) => {
      const perArticle = this.structureForSectionAndArticle(
        sectionId,
        row.article_id
      );
      perArticle && (perArticle.article = row);
    });
  };

  public updateNewReceipt = async (row: Row_Receipt) => {
    const { section_id, article_id, article_count } = row;
    let perArticle = this.structureForSectionAndArticle(section_id, article_id);
    if (!perArticle) {
      const articleResponse = await this.system
        .getDefaultPersistence()
        .tables.article.selectByKey(article_id);
      const { result } = articleResponse;
      const { rows } = result || {};
      const article = rows?.length ? rows[0] : undefined;
      perArticle =
        article && this.getStructureForSectionAndArticle(section_id, article);
    }
    if (perArticle) {
      perArticle.receipt = perArticle.receipt + article_count;
    }
  };

  public updateNewEmission = async (row: Row_Emission) => {
    const { section_id, article_id, article_count } = row;
    let perArticle = this.structureForSectionAndArticle(section_id, article_id);
    if (!perArticle) {
      const articleResponse = await this.system
        .getDefaultPersistence()
        .tables.article.selectByKey(article_id);
      const { result } = articleResponse;
      const { rows } = result || {};
      const article = rows?.length ? rows[0] : undefined;
      perArticle =
        article && this.getStructureForSectionAndArticle(section_id, article);
    }
    if (perArticle) {
      perArticle.emitted = perArticle.emitted + article_count;
    }
  };
}
