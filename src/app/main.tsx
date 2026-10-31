import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ConfigProvider, Spin } from '@douyinfe/semi-ui';
import zh_CN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';
import './styles.scss';
const List = lazy(
  /** 按路由需要延迟加载资源位列表页面。 */
  () => import('@/features/resource-placement/list/ResourcePlacementList')
);
const Editor = lazy(/* 按路由需要延迟加载低码编辑器页面。 */ () => import('@/features/resource-placement/editor'));
createRoot(document.getElementById('root')!).render(
  <ConfigProvider locale={zh_CN}>
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="page-loading">
            <Spin size="large" />
          </div>
        }
      >
        <Routes>
          <Route path="/lowcode" element={<List />} />
          <Route path="/lowcode-editor/:id" element={<Editor />} />
          <Route path="*" element={<Navigate to="/lowcode" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </ConfigProvider>
);
