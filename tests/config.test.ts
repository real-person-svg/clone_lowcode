import { parseConfig } from '../shared/config';
describe('共享配置契约', () => {
  it('接受原配置类型别名、布尔显隐与完整高级字段并保留扩展字段', () => {
    const value = {
      content: [
        {
          type: 'Input',
          key: 'config.title',
          isShow: false,
          require: '(state) => Boolean(state.config.required)',
          validate: 'value => value ? "" : "必填"',
          asyncInject: [
            ['config.a', 'config.b'],
            'state => ({disabled:!state.config.a})'
          ],
          extraLocal: { zh: '标题' }
        },
        {
          type: 'FormCard',
          path: 'config.panel',
          children: [
            {
              type: 'FormInput',
              path: 'config.subtitle',
              isShow: 'state => true'
            }
          ]
        }
      ]
    };
    expect(parseConfig(JSON.stringify(value))).toEqual(value);
  });
  it.each([
    { content: [{ type: 'Input', isShow: 1 }] },
    { content: [{ type: 'Input', require: 1 }] },
    { content: [{ type: 'Input', asyncInject: ['x', 1] }] },
    { content: [{ type: 'Input', path: 'config.__proto__.value' }] },
    { content: [{ type: 'Input', key: 'config.constructor.prototype' }] },
    { content: [{ type: 'Input', children: [{ type: 'Input' }] }] }
  ])('拒绝非法结构 %#', (value) => expect(() => parseConfig(value)).toThrow());
  it('空配置解析为content空数组，未知组件明确报错', () => {
    expect(parseConfig('')).toEqual({ content: [] });
    expect(() => parseConfig({ content: [{ type: 'Missing' }] })).toThrow(
      '未知组件'
    );
  });
});
