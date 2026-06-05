import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  'Aaj kitni sales hui?',
  'Kaunse products low stock mein hain?',
  'Total pending udhaar kitna hai?',
  'Mujhe aaj ka summary do',
  'Kaunsa product best seller hai?',
  'Udhaar customers ki list do',
];

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: '#6366F1', opacity: 0.7,
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
        }} />
      ))}
    </div>
  );
}

function ShopDataCard({ data }) {
  if (!data) return null;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px',
      marginTop: '10px'
    }}>
      {[
        { label: "Today's Revenue", value: `₨ ${(data.totalRevenue || 0).toLocaleString()}`, color: '#10b981', icon: '💰' },
        { label: "Today's Sales",   value: data.todaySales || 0, color: '#6366F1', icon: '🛍️' },
        { label: 'Low Stock Items', value: data.lowStockCount || 0, color: '#f59e0b', icon: '⚠️' },
        { label: 'Pending Udhaar',  value: `₨ ${(data.pendingUdhaar || 0).toLocaleString()}`, color: '#ef4444', icon: '📋' },
      ].map(item => (
        <div key={item.label} style={{
          background: 'rgba(255,255,255,0.04)', border: `0.5px solid ${item.color}20`,
          borderRadius: '8px', padding: '8px 12px',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {item.icon} {item.label}
          </p>
          <p style={{ color: item.color, fontSize: '13px', fontWeight: 700, margin: 0 }}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function AiChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Assalam o Alaikum! 👋 Main ShopSmart AI hun — aapki dukaan ka smart assistant. Aaj main aapki kya madad kar sakta hun?\n\nAap mujhse sales, stock, udhaar, ya kisi bhi cheez ke baare mein pooch sakte hain.',
      time: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [shopData, setShopData] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;

    const userMsg = { role: 'user', content: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await API.post('/ai/chat', { message: msg });
      setShopData(data.shopData);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        time: new Date(),
        shopData: data.shopData,
      }]);
    } catch (err) {
      toast.error('AI se connect nahi hua');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Maafi chahta hun, abhi AI se connect nahi ho pa raha. Thodi der baad dobara koshish karein.',
        time: new Date(),
        isError: true,
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat clear ho gaya! Kya poochna hai? 😊',
      time: new Date(),
    }]);
    setShopData(null);
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ padding: '32px', height: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .fade { animation: fadeIn 0.3s ease forwards; }
        .suggestion:hover { background: rgba(99,102,241,0.15) !important; border-color: rgba(99,102,241,0.4) !important; color: #818cf8 !important; }
        .send-btn:hover { opacity: 0.85; transform: scale(1.04); }
        .chat-input:focus { border-color: rgba(99,102,241,0.5) !important; }
      `}</style>

      {/* Header */}
      <div className="fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px',
            boxShadow: '0 4px 16px rgba(99,102,241,0.35)'
          }}>🤖</div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>ShopSmart AI</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 500 }}>Online — Llama 3.3 70B</span>
            </div>
          </div>
        </div>
        <button onClick={clearChat} style={{
          padding: '8px 16px', background: 'rgba(255,255,255,0.05)',
          border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '8px',
          color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px',
          fontFamily: 'Inter,sans-serif', transition: 'all 0.2s'
        }}>🗑️ Clear Chat</button>
      </div>

      {/* Live Stats Bar */}
      {shopData && (
        <div className="fade" style={{
          display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', flexShrink: 0
        }}>
          {[
            { label: "Revenue", value: `₨ ${(shopData.totalRevenue || 0).toLocaleString()}`, color: '#10b981', icon: '💰' },
            { label: "Sales",   value: shopData.todaySales || 0, color: '#6366F1', icon: '🛍️' },
            { label: "Low Stock", value: shopData.lowStockCount || 0, color: '#f59e0b', icon: '⚠️' },
            { label: "Udhaar",  value: `₨ ${(shopData.pendingUdhaar || 0).toLocaleString()}`, color: '#ef4444', icon: '📋' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${s.color}25`,
              borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ fontSize: '14px' }}>{s.icon}</span>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: '13px', fontWeight: 700, margin: 0 }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Window */}
      <div style={{
        flex: 1, overflowY: 'auto', background: 'rgba(255,255,255,0.02)',
        border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '16px',
        padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
        marginBottom: '16px', minHeight: 0,
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent'
      }}>
        {messages.map((msg, i) => {
          const isAI = msg.role === 'assistant';
          return (
            <div key={i} className="fade" style={{
              display: 'flex', flexDirection: isAI ? 'row' : 'row-reverse',
              gap: '10px', alignItems: 'flex-start'
            }}>
              {/* Avatar */}
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                background: isAI ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,0.1)',
                border: isAI ? 'none' : '0.5px solid rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px'
              }}>{isAI ? '🤖' : '👤'}</div>

              {/* Bubble */}
              <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: isAI ? 'flex-start' : 'flex-end' }}>
                <div style={{
                  padding: '12px 16px', borderRadius: isAI ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  background: isAI
                    ? msg.isError ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)'
                    : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                  border: isAI
                    ? `0.5px solid ${msg.isError ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)'}`
                    : 'none',
                  color: '#fff',
                  fontSize: '14px', lineHeight: 1.65,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {msg.content}
                </div>

                {/* Show shop data card for first AI response with data */}
                {isAI && msg.shopData && i === messages.length - 1 && (
                  <div style={{ width: '100%', maxWidth: '380px' }}>
                    <ShopDataCard data={msg.shopData} />
                  </div>
                )}

                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', padding: '0 4px' }}>
                  {formatTime(msg.time)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="fade" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px'
            }}>🤖</div>
            <div style={{
              padding: '12px 16px', borderRadius: '4px 16px 16px 16px',
              background: 'rgba(99,102,241,0.1)', border: '0.5px solid rgba(99,102,241,0.2)'
            }}>
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', flexShrink: 0 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} className="suggestion" onClick={() => sendMessage(s)} style={{
              padding: '7px 14px', background: 'rgba(255,255,255,0.04)',
              border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '20px',
              color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: '12px',
              fontFamily: 'Inter,sans-serif', transition: 'all 0.2s'
            }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="fade" style={{
        display: 'flex', gap: '10px', alignItems: 'flex-end', flexShrink: 0
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Koi bhi sawaal poochein... (Enter to send)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            style={{
              width: '100%', padding: '13px 16px', paddingRight: '50px',
              background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.12)',
              borderRadius: '12px', color: '#fff', fontSize: '14px',
              fontFamily: 'Inter,sans-serif', outline: 'none', resize: 'none',
              lineHeight: 1.5, transition: 'border-color 0.2s', boxSizing: 'border-box',
              scrollbarWidth: 'none'
            }}
          />
        </div>
        <button
          className="send-btn"
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={{
            width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
            background: input.trim() && !loading
              ? 'linear-gradient(135deg,#6366F1,#8B5CF6)'
              : 'rgba(255,255,255,0.06)',
            border: '0.5px solid rgba(255,255,255,0.1)',
            color: '#fff', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            fontSize: '20px', transition: 'all 0.2s', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: input.trim() && !loading ? '0 4px 16px rgba(99,102,241,0.35)' : 'none'
          }}
        >
          {loading ? '⏳' : '➤'}
        </button>
      </div>

      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center', marginTop: '8px', flexShrink: 0 }}>
        Powered by Groq · Llama 3.3 70B · Real-time shop data
      </p>
    </div>
  );
}

export default AiChat;