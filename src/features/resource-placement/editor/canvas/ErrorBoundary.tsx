import { Card, Typography } from '@douyinfe/semi-ui';
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

  static getDerivedStateFromError(e: Error): State {
    return { hasError: true, errorInfo: e };
  }

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
