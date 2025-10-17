import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { ScrollArea } from './scroll-area';
import { Badge } from './badge';
import { Separator } from './separator';
import { Loader2, MessageCircle, Send, HelpCircle, BookOpen, ExternalLink } from 'lucide-react';
import { documentationService } from '../../api/integrations/documentationService';
import { createSecureLogger } from '../../utils/secureLogger';

const logger = createSecureLogger('DocumentationAssistant');

/**
 * Documentation Assistant Component
 * Provides AI-powered Q&A functionality for O7C Hub documentation
 */
export function DocumentationAssistant({ className = '', isOpen = false, onToggle }) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [isServiceAvailable, setIsServiceAvailable] = useState(true);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);

  // Check service availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await documentationService.isServiceAvailable();
      setIsServiceAvailable(available);
    };
    checkAvailability();
  }, []);

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [conversation]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userQuestion = question.trim();
    setQuestion('');
    setIsLoading(true);

    // Add user question to conversation
    const newConversation = [...conversation, {
      type: 'question',
      content: userQuestion,
      timestamp: new Date().toISOString()
    }];
    setConversation(newConversation);

    try {
      logger.info('Submitting documentation question', {
        questionLength: userQuestion.length
      });

      const response = await documentationService.askQuestion(userQuestion);

      if (response.success) {
        setConversation([...newConversation, {
          type: 'answer',
          content: response.answer,
          metadata: response.metadata,
          timestamp: response.generatedAt
        }]);
      } else {
        setConversation([...newConversation, {
          type: 'error',
          content: response.error || 'Failed to get answer',
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      logger.error('Error in documentation assistant', {
        error: error.message,
        question: userQuestion
      });

      setConversation([...newConversation, {
        type: 'error',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setConversation([]);
  };

  const renderMessage = (message, index) => {
    switch (message.type) {
      case 'question':
        return (
          <div key={index} className="flex justify-end mb-4">
            <div className="max-w-[80%] bg-blue-500 text-white rounded-lg px-4 py-2">
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        );

      case 'answer':
        return (
          <div key={index} className="flex justify-start mb-4">
            <div className="max-w-[80%] bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Documentation Assistant
                </span>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.metadata?.relevantSections && message.metadata.relevantSections.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Relevant sections:</p>
                  <div className="flex flex-wrap gap-1">
                    {message.metadata.relevantSections.slice(0, 3).map((section, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {section.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'error':
        return (
          <div key={index} className="flex justify-start mb-4">
            <div className="max-w-[80%] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  Error
                </span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">{message.content}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-96 h-[600px] shadow-xl z-50 flex flex-col ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Documentation Assistant
        </CardTitle>
        <Button
          onClick={onToggle}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          ×
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {!isServiceAvailable && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Documentation assistant is currently unavailable. Some features may not work properly.
            </p>
          </div>
        )}

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {conversation.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Ask me anything about O7C Hub!</h3>
              <p className="text-sm">
                I can help you with questions about features, setup, troubleshooting, and more.
              </p>
              <div className="mt-4 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestion('How do I add a new athlete?')}
                  className="mr-2"
                >
                  How do I add a new athlete?
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestion('What are the recruiting tools available?')}
                >
                  Recruiting tools
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {conversation.map((message, index) => renderMessage(message, index))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <div className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about O7C Hub..."
              disabled={isLoading || !isServiceAvailable}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !question.trim() || !isServiceAvailable}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {conversation.length > 0 && (
            <Button
              onClick={clearConversation}
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-xs"
            >
              Clear conversation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DocumentationAssistant;