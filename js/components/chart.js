// ===== CHART WRAPPER COMPONENT =====

const ChartComponent = {
  instances: {},

  /**
   * Destroy a chart instance
   */
  destroy(canvasId) {
    if (this.instances[canvasId]) {
      this.instances[canvasId].destroy();
      delete this.instances[canvasId];
    }
  },

  /**
   * Destroy all chart instances
   */
  destroyAll() {
    Object.keys(this.instances).forEach(id => this.destroy(id));
  },

  /**
   * Create a bar chart (e.g., daily spending trend)
   */
  bar(canvasId, labels, data, options = {}) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    
    this.instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: options.colors || 'rgba(0, 229, 160, 0.6)',
          borderColor: options.borderColors || 'rgba(0, 229, 160, 1)',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1A1A24',
            titleColor: '#F5F5F7',
            bodyColor: '#8B8BA3',
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            callbacks: {
              label: (ctx) => `₹${ctx.parsed.y.toLocaleString('en-IN')}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#5A5A72', font: { size: 11, family: 'Outfit' } },
            border: { display: false }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#5A5A72',
              font: { size: 11, family: 'Outfit' },
              callback: (val) => '₹' + val.toLocaleString('en-IN')
            },
            border: { display: false },
            beginAtZero: true
          }
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    });

    return this.instances[canvasId];
  },

  /**
   * Create a donut/pie chart (e.g., category breakdown)
   */
  donut(canvasId, labels, data, colors, options = {}) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');

    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: '#0F0F14',
          borderWidth: 3,
          hoverBorderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1A1A24',
            titleColor: '#F5F5F7',
            bodyColor: '#8B8BA3',
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
                return `₹${ctx.parsed.toLocaleString('en-IN')} (${pct}%)`;
              }
            }
          }
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    });

    return this.instances[canvasId];
  },

  /**
   * Create a line chart
   */
  line(canvasId, labels, data, options = {}) {
    this.destroy(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 229, 160, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 229, 160, 0)');

    this.instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: '#00E5A0',
          borderWidth: 2.5,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00E5A0',
          pointBorderColor: '#0F0F14',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1A1A24',
            titleColor: '#F5F5F7',
            bodyColor: '#8B8BA3',
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            callbacks: {
              label: (ctx) => `₹${ctx.parsed.y.toLocaleString('en-IN')}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#5A5A72', font: { size: 11, family: 'Outfit' } },
            border: { display: false }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#5A5A72',
              font: { size: 11, family: 'Outfit' },
              callback: (val) => '₹' + val.toLocaleString('en-IN')
            },
            border: { display: false },
            beginAtZero: true
          }
        },
        animation: {
          duration: 800,
          easing: 'easeOutQuart'
        }
      }
    });

    return this.instances[canvasId];
  }
};
