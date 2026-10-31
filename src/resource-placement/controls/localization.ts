/** Chinese fallback copy from the source controls; there is no platform translation request. */
export const I18n = {
  /** 选取本地回退文案并替换命名参数，不请求翻译平台。 */
  t(
    key: string,
    paramsOrFallback: Record<string, unknown> | string = {},
    fallback?: string,
  ): string {
    const params = typeof paramsOrFallback === 'object' ? paramsOrFallback : {};
    const text =
      fallback ??
      (typeof paramsOrFallback === 'string' ? paramsOrFallback : key);
    return text.replace(/\{([^}]+)\}/g,
      /* 替换文案中的参数占位符，缺失参数时保留原占位符。 */
      (_, name: string) =>
        String(params[name] ?? `{${name}}`),
    );
  },
};
export const CAPCUT_LG = [
  { value: 'ar', label: I18n.t('arabic', {}, '阿拉伯语') },
  {
    value: 'cs-CZ',
    label: I18n.t('czech_(czech_republic)', {}, '捷克语（捷克共和国）'),
  },
  { value: 'de-DE', label: I18n.t('german_(germany)', {}, '德语（德国）') },
  { value: 'el-GR', label: I18n.t('greek_(greece)', {}, '希腊语（希腊）') },
  { value: 'en', label: I18n.t('english', {}, '英语') },
  {
    value: 'es-LA',
    label: I18n.t('spanish_(latin_america)', {}, '西班牙语（拉美）'),
  },
  { value: 'fi-FI', label: I18n.t('finnish_(finland)', {}, '芬兰语（芬兰）') },
  {
    value: 'fil-PH',
    label: I18n.t('filipino_(philippines)', {}, '菲律宾语（菲律宾）'),
  },
  { value: 'fr-FR', label: I18n.t('french_(france)', {}, '法语（法国）') },
  {
    value: 'he-IL',
    label: I18n.t('hebrew_(israel)', {}, '希伯来语（以色列）'),
  },
  {
    value: 'hu-HU',
    label: I18n.t('hungarian_(hungary)', {}, '匈牙利语（匈牙利）'),
  },
  {
    value: 'id-ID',
    label: I18n.t('indonesian_(indonesian)', {}, '印尼语（印度尼西亚）'),
  },
  {
    value: 'it-IT',
    label: I18n.t('italian_(italy)', {}, '意大利语（意大利）'),
  },
  { value: 'ja-JP', label: I18n.t('japanese_(japan)', {}, '日语（日本）') },
  { value: 'km-KH', label: I18n.t('khmer_(cambodia)', {}, '高棉语（柬埔寨）') },
  {
    value: 'vi-VN',
    label: I18n.t('vietnamese_(vietnamese)', {}, '越南语（越南）'),
  },
  { value: 'ko-KR', label: I18n.t('korean_(south_korea)', {}, '韩语（韩国）') },
  {
    value: 'ms-MY',
    label: I18n.t('malay_(malaysia)', {}, '马来语（马来西亚）'),
  },
  { value: 'my-MM', label: I18n.t('myanmar_(myanmar)', {}, '缅甸（缅甸）') },
  {
    value: 'nl-NL',
    label: I18n.t('netherlands_(netherlands)', {}, '荷兰（荷兰）'),
  },
  { value: 'pl-PL', label: I18n.t('polish_(poland)', {}, '波兰语（波兰）') },
  {
    value: 'pt-BR',
    label: I18n.t('portuguese_(brazil)', {}, '葡萄牙语（巴西）'),
  },
  {
    value: 'ro-RO',
    label: I18n.t('romania_(romania)', {}, '罗马尼亚（罗马尼亚）'),
  },
  { value: 'ru-RU', label: I18n.t('russian_(russian)', {}, '俄语（俄罗斯）') },
  { value: 'sv-SE', label: I18n.t('swedish_(sweden)', {}, '瑞典语（瑞典）') },
  { value: 'th-TH', label: I18n.t('thai_(thailand)', {}, '泰语（泰国）') },
  {
    value: 'tr-TR',
    label: I18n.t('turkish_(turkish)', {}, '土耳其语（土耳其）'),
  },
  {
    value: 'uk-UA',
    label: I18n.t('ukrainian_(ukraine)', {}, '乌克兰语（乌克兰）'),
  },
  {
    value: 'ur-PK',
    label: I18n.t(
      'urdu_(islamic_republic_of_pakistan)',
      {},
      '乌尔都语（巴基斯坦伊斯兰共和国）',
    ),
  },
  {
    value: 'zh-Hans',
    label: I18n.t('chinese_(simplified)', {}, '中文（简体）'),
  },
  {
    value: 'zh-Hant-TW',
    label: I18n.t('chinese_(traditional)_(taiwan)', {}, '中文（繁体）（台湾）'),
  },
];
/** Standalone region defaults use ISO country codes; custom configured options remain supported. */
export const regionList = [
  { value: 'CN', label: '中国' },
  { value: 'US', label: '美国' },
  { value: 'JP', label: '日本' },
  { value: 'GB', label: '英国' },
  { value: 'SG', label: '新加坡' },
];
