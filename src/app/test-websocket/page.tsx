'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/store';

export default function TestWebSocketPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Not connected');
  const [messages, setMessages] = useState<string[]>([]);
  const [testMessage, setTestMessage] = useState('');

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    addMessage('🚀 Starting WebSocket test...');
    
    // Test basic Supabase connection first
    const testBasicConnection = async () => {
      try {
        addMessage('📡 Testing basic Supabase connection...');
        const { error } = await supabase
          .from('matches')
          .select('count')
          .limit(1);
        
        if (error) {
          addMessage(`❌ Basic connection failed: ${error.message}`);
          return false;
        } else {
          addMessage('✅ Basic Supabase connection successful');
          return true;
        }
      } catch (err) {
        addMessage(`💥 Connection test error: ${err}`);
        return false;
      }
    };

    // Test broadcast channel with different configurations
    const testBroadcast = async () => {
      if (!(await testBasicConnection())) {
        return;
      }

      addMessage('🎯 Testing WebSocket connection directly...');
      
      // Test 1: Minimal channel setup
      addMessage('Test 1: Minimal channel configuration');
      const channel1 = supabase.channel('test-minimal');
      
      channel1.subscribe((status) => {
        addMessage(`📊 Minimal channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          addMessage('✅ Test 1 SUCCESS: Minimal channel works!');
          setConnectionStatus('SUBSCRIBED');
        } else if (status === 'CHANNEL_ERROR') {
          addMessage('❌ Test 1 FAILED: Minimal channel error');
          setConnectionStatus('CHANNEL_ERROR');
        }
      });

      // Test 2: With broadcast config after delay
      setTimeout(() => {
        addMessage('Test 2: Channel with broadcast configuration');
        const channel2 = supabase.channel('test-broadcast', {
          config: {
            broadcast: { self: true }
          }
        });

        channel2
          .on('broadcast', { event: 'test' }, (payload) => {
            addMessage(`📨 Test 2 - Received: ${JSON.stringify(payload)}`);
          })
          .subscribe((status) => {
            addMessage(`📊 Broadcast channel status: ${status}`);
            
            if (status === 'SUBSCRIBED') {
              addMessage('✅ Test 2 SUCCESS: Broadcast channel works!');
              
              // Send test message
              setTimeout(() => {
                addMessage('📤 Sending test broadcast...');
                channel2.send({
                  type: 'broadcast',
                  event: 'test',
                  payload: { message: 'Hello!', timestamp: Date.now() }
                });
              }, 500);
            } else if (status === 'CHANNEL_ERROR') {
              addMessage('❌ Test 2 FAILED: Broadcast channel error');
            }
          });
      }, 2000);

      // Cleanup
      return () => {
        addMessage('🧹 Cleaning up test channels');
        supabase.removeAllChannels();
      };
    };

    const cleanup = testBroadcast();
    
    return () => {
      cleanup?.then(fn => fn?.());
    };
  }, []);

  const sendTestMessage = () => {
    if (testMessage.trim()) {
      addMessage(`🧪 Manual test: ${testMessage}`);
      setTestMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">WebSocket Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'SUBSCRIBED' ? 'bg-green-500' : 
              connectionStatus === 'CHANNEL_ERROR' ? 'bg-red-500' : 
              'bg-yellow-500'
            }`}></div>
            <span className="font-mono text-sm">{connectionStatus}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">Test Message</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message..."
              className="flex-1 px-3 py-2 border rounded-md"
              onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
            />
            <button
              onClick={sendTestMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Debug Log</h2>
          <div className="bg-gray-50 rounded p-3 max-h-96 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className="font-mono text-sm mb-1 break-words">
                {msg}
              </div>
            ))}
          </div>
          <button
            onClick={() => setMessages([])}
            className="mt-2 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
          >
            Clear Log
          </button>
        </div>
      </div>
    </div>
  );
}