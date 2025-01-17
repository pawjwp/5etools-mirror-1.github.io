"use strict";

class VariantRulesSublistManager extends SublistManager {
	constructor () {
		super({
			sublistClass: "subvariantrules",
		});
	}

	static get _ROW_TEMPLATE () {
		return [
			new SublistCellTemplate({
				name: "Name",
				css: "bold col-10 pl-0",
				colStyle: "",
			}),
			new SublistCellTemplate({
				name: "Type",
				css: "col-3 ve-text-center pr-0",
				colStyle: "text-center",
			}),
		];
	}

	pGetSublistItem (it, hash) {
		const cellsText = [it.name, it.ruleType ? Parser.ruleTypeToFull(it.ruleType) : "\u2014"];

		const $ele = $(`<div class="lst__row lst__row--sublist ve-flex-col">
			<a href="#${hash}" class="lst--border lst__row-inner">
				${this.constructor._getRowCellsHtml({values: cellsText})}
			</a>
		</div>`)
			.contextmenu(evt => this._handleSublistItemContextMenu(evt, listItem))
			.click(evt => this._listSub.doSelect(listItem, evt));

		const listItem = new ListItem(
			hash,
			$ele,
			it.name,
			{
				hash,
				ruleType: it.ruleType || "",
			},
			{
				entity: it,
				mdRow: [...cellsText],
			},
		);
		return listItem;
	}
}

class VariantRulesPage extends ListPage {
	constructor () {
		const pageFilter = new PageFilterVariantRules();
		super({
			dataSource: DataUtil.variantrule.loadJSON.bind(DataUtil.variantrule),

			pageFilter,

			listClass: "variantrules",

			dataProps: ["variantrule"],
		});
	}

	getListItem (rule, rlI, isExcluded) {
		this._pageFilter.mutateAndAddToFilters(rule, isExcluded);

		const searchStack = [];
		for (const e1 of rule.entries) {
			Renderer.getNames(searchStack, e1);
		}

		const eleLi = document.createElement("div");
		eleLi.className = `lst__row ve-flex-col ${isExcluded ? "lst__row--blocklisted" : ""}`;

		const source = Parser.sourceJsonToAbv(rule.source);
		const hash = UrlUtil.autoEncodeHash(rule);

		eleLi.innerHTML = `<a href="#${hash}" class="lst--border lst__row-inner">
			<span class="bold col-7 pl-0">${rule.name}</span>
			<span class="col-3 ve-text-center">${rule.ruleType ? Parser.ruleTypeToFull(rule.ruleType) : "\u2014"}</span>
			<span class="col-2 ve-text-center ${Parser.sourceJsonToColor(rule.source)} pr-0" title="${Parser.sourceJsonToFull(rule.source)}" ${Parser.sourceJsonToStyle(rule.source)}>${source}</span>
		</a>`;

		const listItem = new ListItem(
			rlI,
			eleLi,
			rule.name,
			{
				hash,
				search: searchStack.join(","),
				source,
				ruleType: rule.ruleType || "",
			},
			{
				isExcluded,
			},
		);

		eleLi.addEventListener("click", (evt) => this._list.doSelect(listItem, evt));
		eleLi.addEventListener("contextmenu", (evt) => this._openContextMenu(evt, this._list, listItem));

		return listItem;
	}

	_renderStats_doBuildStatsTab ({ent}) {
		this._$pgContent.empty().append(RenderVariantRules.$getRenderedVariantRule(ent));
	}

	async _pDoLoadSubHash ({sub, lockToken}) {
		sub = await super._pDoLoadSubHash({sub, lockToken});

		if (!sub.length) return;
		const $title = $(`.rd__h[data-title-index="${sub[0]}"]`);
		if ($title.length) $title[0].scrollIntoView();
	}
}

const variantRulesPage = new VariantRulesPage();
variantRulesPage.sublistManager = new VariantRulesSublistManager();
window.addEventListener("load", () => variantRulesPage.pOnLoad());
