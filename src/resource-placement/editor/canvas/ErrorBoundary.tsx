import { Typography } from '@douyinfe/semi-ui';
import React, { Component, ErrorInfo, ReactNode } from 'react';

const { Text, Title } = Typography;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  /** 将子控件渲染异常保存为边界的错误状态。 */
  static getDerivedStateFromError(e: Error): State {
    return { hasError: true, errorInfo: e };
  }

  /** 记录控件渲染异常和 React 组件栈，便于排查。 */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', {
      error,
      errorInfo,
      info: JSON.stringify(error, undefined, 4),
    });
    this.setState({
      hasError: true,
      errorInfo: error,
    });
  }

  /** 正常时渲染子控件，异常时展示错误提示。 */
  render() {
    const { hasError, errorInfo } = this.state;
    if (hasError) {
      return (
        <div>
          <Title heading={4}>组件预览失败</Title>
          <Text code>{errorInfo?.message}</Text>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
