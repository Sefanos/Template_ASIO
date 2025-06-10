import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  TooltipItem,
  registerables
} from 'chart.js';
import { Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { RevenueTimelineData } from '../../../../models/financial.model';
import { FinancialService } from '../../../../services/financial.service';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-revenue-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './revenue-timeline.component.html',
  styleUrls: ['./revenue-timeline.component.css']
})
export class RevenueTimelineComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  // Chart view modes
  selectedView: string = 'monthly_trend';
  viewModes = [
    {
      id: 'monthly_trend',
      label: 'Monthly Trend',
      description: 'Month-by-month revenue progression',
      icon: '📈'
    },
    {
      id: 'year_comparison',
      label: 'Year Comparison',
      description: 'Compare same months across years',
      icon: '📊'
    },
    {
      id: 'quarterly',
      label: 'Quarterly View',
      description: 'Quarterly performance analysis',
      icon: '🗓️'
    },
    {
      id: 'yearly_totals',
      label: 'Yearly Totals',
      description: 'Annual revenue comparison',
      icon: '📋'
    }
  ];

  // Date range filters
  fromDate: string = '2022-01-01';
  toDate: string = '2025-12-31';

  // Quick date range presets
  datePresets = [
    { label: 'Last 12 Months', getValue: () => this.getLast12Months() },
    { label: 'Current Year', getValue: () => this.getCurrentYear() },
    { label: 'Last 2 Years', getValue: () => this.getLast2Years() },
    { label: 'All Time', getValue: () => ({ from: '2022-01-01', to: '2025-12-31' }) }
  ];

  // Loading and error states
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';

  // Chart data
  timelineData: RevenueTimelineData | null = null;
  chart: Chart | null = null;
  calculatedGrowthRate: number = 0;

  // Chart styling
  chartColors = {
    primary: '#0358B6',
    success: '#44DE28',
    warning: '#F46300',
    danger: '#D60000',
    info: '#8B5CF6',
    secondary: '#EC4899',
    gradient: ['#0358B6', '#44DE28', '#F46300', '#D60000', '#8B5CF6']
  };

  private dataSubscription?: Subscription;

  // Add this with your other properties
  selectedDatePreset: string | null = null;

  constructor(private financialService: FinancialService) { }

  ngOnInit(): void {
    this.loadTimelineData();
  }

  ngAfterViewInit(): void {
    if (this.timelineData) {
      setTimeout(() => {
        this.createChart(this.timelineData!);
      }, 0);
    }
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.chart) {
      this.chart.destroy();
    }
  }

  /**
   * Load timeline data from API
   */
  loadTimelineData(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    console.log(`Loading data from ${this.fromDate} to ${this.toDate}`);

    this.dataSubscription = this.financialService.getRevenueTimeline(
      'monthly',
      this.fromDate,
      this.toDate
    ).pipe(
      catchError((error: any) => {
        console.error('Error loading timeline data:', error);
        this.hasError = true;
        this.errorMessage = error.message || 'Failed to load timeline data. Please try again later.';
        return of(null); // Return null instead of fallback data
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (data: RevenueTimelineData | null) => {
        if (data) {
          this.timelineData = data;
          // Calculate dynamic growth rate instead of using the API value
          this.calculatedGrowthRate = this.calculateGrowthRate(data);
          console.log('Timeline data loaded:', data);
          console.log('Calculated growth rate:', this.calculatedGrowthRate);
          // Use setTimeout to ensure the DOM is updated before creating the chart
          setTimeout(() => {
            this.createChart(data);
          }, 0);
        }
      }
    });
  }

  /**
   * Create Chart.js chart based on selected view
   */
  private createChart(data: RevenueTimelineData): void {
    console.log('Creating chart with data:', data);

    if (this.chart) {
      this.chart.destroy();
    }

    // Safety check - ensure the canvas element exists
    if (!this.chartCanvas || !this.chartCanvas.nativeElement) {
      console.error('Chart canvas element not found');
      this.errorMessage = 'Unable to initialize chart: Canvas element not found';
      this.hasError = true;
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context from canvas');
      return;
    }

    // Ensure canvas has dimensions
    const containerWidth = this.chartCanvas.nativeElement.parentElement?.clientWidth || 500;
    this.chartCanvas.nativeElement.width = containerWidth;
    this.chartCanvas.nativeElement.height = 400;

    if (!data.revenue_by_period || data.revenue_by_period.length === 0) {
      console.error('No revenue data available for the chart');
      this.errorMessage = 'No revenue data available for the selected period';
      this.hasError = true;
      return;
    }

    try {
      let chartData: ChartData<'bar'>;
      let config: ChartConfiguration<'bar'>;

      // Select the appropriate chart data and configuration based on view
      switch (this.selectedView) {
        case 'year_comparison':
          chartData = this.prepareYearComparisonData(data);
          config = this.getYearComparisonConfig(chartData);
          break;
        case 'quarterly':
          chartData = this.prepareQuarterlyData(data);
          config = this.getQuarterlyConfig(chartData);
          break;
        case 'yearly_totals':
          chartData = this.prepareYearlyTotalsData(data);
          config = this.getYearlyTotalsConfig(chartData);
          break;
        default:
          chartData = this.prepareMonthlyTrendData(data);
          config = this.getMonthlyTrendConfig(chartData);
      }

      console.log('Creating chart with config:', config);
      this.chart = new Chart(ctx, config);
    } catch (error) {
      console.error('Error creating chart:', error);
      this.errorMessage = 'Failed to create chart: ' + (error instanceof Error ? error.message : String(error));
      this.hasError = true;
    }
  }

  /**
   * Prepare monthly trend data (time series)
   */
  private prepareMonthlyTrendData(data: RevenueTimelineData): ChartData<'bar'> {
    const labels = data.revenue_by_period.map(item => this.formatMonthLabel(item.period));
    const amounts = data.revenue_by_period.map(item => item.amount);

    // Color based on performance (compared to average)
    const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const colors = amounts.map(amount => {
      if (amount > average * 1.1) return this.chartColors.success;
      if (amount < average * 0.9) return this.chartColors.danger;
      return this.chartColors.primary;
    });

    return {
      labels,
      datasets: [{
        label: 'Monthly Revenue',
        data: amounts,
        backgroundColor: colors.map(color => this.transparentize(color, 0.7)),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 4,
      }]
    };
  }

  /**
   * Prepare year-over-year comparison (grouped by month)
   */
  private prepareYearComparisonData(data: RevenueTimelineData): ChartData<'bar'> {
    // Group data by year
    const yearData: { [year: string]: { [month: string]: number } } = {};

    data.revenue_by_period.forEach(item => {
      if (!item.period) return;

      // Fix: Handle both string and number types safely
      const periodStr = typeof item.period === 'string' ? item.period : String(item.period);
      const parts = periodStr.split('-');

      if (parts.length >= 2) {
        const year = parts[0];
        const month = parts[1];
        if (!yearData[year]) yearData[year] = {};
        yearData[year][month] = item.amount;
      }
    });

    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const monthLabels = months.map(m => this.getMonthName(parseInt(m, 10)));
    const years = Object.keys(yearData).sort();

    const datasets = years.map((year, index) => ({
      label: year,
      data: months.map(month => yearData[year][month] || 0),
      backgroundColor: this.transparentize(this.chartColors.gradient[index % this.chartColors.gradient.length], 0.7),
      borderColor: this.chartColors.gradient[index % this.chartColors.gradient.length],
      borderWidth: 2,
      borderRadius: 4,
    }));

    return {
      labels: monthLabels,
      datasets
    };
  }

  /**
   * Prepare quarterly data
   */
  private prepareQuarterlyData(data: RevenueTimelineData): ChartData<'bar'> {
    const quarterData: { [key: string]: number } = {};

    data.revenue_by_period.forEach(item => {
      if (!item.period) return;

      // Fix: Handle both string and number types safely
      const periodStr = typeof item.period === 'string' ? item.period : String(item.period);
      const parts = periodStr.split('-');

      if (parts.length >= 2) {
        const year = parts[0];
        const month = parseInt(parts[1], 10);
        const quarter = Math.ceil(month / 3);
        const key = `${year} Q${quarter}`;

        quarterData[key] = (quarterData[key] || 0) + item.amount;
      }
    });

    const labels = Object.keys(quarterData).sort();
    const amounts = labels.map(label => quarterData[label]);

    return {
      labels,
      datasets: [{
        label: 'Quarterly Revenue',
        data: amounts,
        backgroundColor: this.transparentize(this.chartColors.info, 0.7),
        borderColor: this.chartColors.info,
        borderWidth: 2,
        borderRadius: 4,
      }]
    };
  }

  /**
   * Prepare yearly totals data
   */
  private prepareYearlyTotalsData(data: RevenueTimelineData): ChartData<'bar'> {
    const yearTotals: { [year: string]: number } = {};

    data.revenue_by_period.forEach(item => {
      if (!item.period) return;

      // Fix: Check if period exists and properly convert to string
      const periodStr = typeof item.period === 'string'
        ? item.period
        : String(item.period);

      const parts = periodStr.split('-');
      if (parts.length >= 1) {
        const year = parts[0];
        yearTotals[year] = (yearTotals[year] || 0) + item.amount;
      }
    });

    const years = Object.keys(yearTotals).sort();
    const totals = years.map(year => yearTotals[year]);

    // Color based on growth
    const colors = totals.map((total, index) => {
      if (index === 0) return this.chartColors.primary;
      const growth = (total - totals[index - 1]) / totals[index - 1];
      if (growth > 0.05) return this.chartColors.success;
      if (growth < -0.05) return this.chartColors.danger;
      return this.chartColors.warning;
    });

    return {
      labels: years,
      datasets: [{
        label: 'Annual Revenue',
        data: totals,
        backgroundColor: colors.map(color => this.transparentize(color, 0.7)),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 4,
      }]
    };
  }

  /**
   * Get chart configuration for monthly trend
   */
  private getMonthlyTrendConfig(chartData: ChartData<'bar'>): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Revenue Trend',
            font: { size: 16, weight: 'bold' }
          },
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'bar'>) => `Revenue: ${this.formatCurrency(context.parsed.y)}`,
              afterLabel: (context: TooltipItem<'bar'>) => {
                if (context.dataIndex > 0) {
                  const current = context.parsed.y;
                  const previous = chartData.datasets[0].data[context.dataIndex - 1] as number;
                  // Avoid division by zero
                  if (previous === 0) return '';
                  const growth = ((current - previous) / previous * 100).toFixed(1);
                  return `Growth: ${parseFloat(growth) >= 0 ? '+' : ''}${growth}%`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxRotation: 45, font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (tickValue: string | number): string => {
                const numericValue = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
                return this.formatCurrencyShort(numericValue);
              }
            }
          }
        }
      }
    };
  }

  /**
   * Get chart configuration for year comparison
   */
  private getYearComparisonConfig(chartData: ChartData<'bar'>): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Year-over-Year Monthly Comparison',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context: TooltipItem<'bar'>) => `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (tickValue: string | number): string => {
                const numericValue = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
                return this.formatCurrencyShort(numericValue);
              }
            }
          }
        }
      }
    };
  }

  /**
   * Get chart configuration for quarterly view
   */
  private getQuarterlyConfig(chartData: ChartData<'bar'>): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Quarterly Revenue Performance',
            font: { size: 16, weight: 'bold' }
          },
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'bar'>) => `Revenue: ${this.formatCurrency(context.parsed.y)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (tickValue: string | number): string => {
                const numericValue = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
                return this.formatCurrencyShort(numericValue);
              }
            }
          }
        }
      }
    };
  }

  /**
   * Get chart configuration for yearly totals
   */
  private getYearlyTotalsConfig(chartData: ChartData<'bar'>): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Annual Revenue Growth',
            font: { size: 16, weight: 'bold' }
          },
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<'bar'>) => `Annual Revenue: ${this.formatCurrency(context.parsed.y)}`,
              afterLabel: (context: TooltipItem<'bar'>) => {
                if (context.dataIndex > 0) {
                  const current = context.parsed.y;
                  const previous = chartData.datasets[0].data[context.dataIndex - 1] as number;
                  // Avoid division by zero
                  if (previous === 0) return '';
                  const growth = ((current - previous) / previous * 100).toFixed(1);
                  return `YoY Growth: ${parseFloat(growth) >= 0 ? '+' : ''}${growth}%`;
                }
                return '';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 12 } }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (tickValue: string | number): string => {
                const numericValue = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
                return this.formatCurrencyShort(numericValue);
              }
            }
          }
        }
      }
    };
  }

  /**
   * Get description for selected view mode
   */
  getSelectedViewDescription(): string {
    const selectedMode = this.viewModes.find(m => m.id === this.selectedView);
    return selectedMode?.description || '';
  }

  /**
   * Get formatted currency display for template
   */
  getCurrencyDisplay(value: number): string {
    return this.formatCurrency(value);
  }

  /**
   * Get formatted growth rate display
   */
  getGrowthRateDisplay(growthRate: number): string {
    // Handle invalid values
    if (!isFinite(growthRate)) {
      return '0.0%';
    }

    const prefix = growthRate > 0 ? '+' : '';
    return `${prefix}${growthRate.toFixed(1)}%`;
  }

  // Make formatCurrency method public (remove private keyword)
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  // Format currency with K/M suffix for chart labels
  private formatCurrencyShort(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  }

  // Helper methods
  /**
   * Change the view mode and refresh chart
   */
  changeView(view: string): void {
    this.selectedView = view;
    console.log('Changed view to:', view);
    if (this.timelineData) {
      // Use setTimeout to ensure DOM updates before chart re-rendering
      setTimeout(() => {
        this.createChart(this.timelineData!);
      }, 0);
    }
  }

  /**
   * Apply date filter and refresh data
   */
  applyDateFilter(preservePreset: boolean = false): void {
    if (!preservePreset) {
      this.selectedDatePreset = null;
    }
    console.log('Applying date filter:', this.fromDate, 'to', this.toDate);
    this.loadTimelineData();
  }

  applyDatePreset(preset: { label: string, getValue: () => { from: string, to: string } }): void {
    this.selectedDatePreset = preset.label;
    const dates = preset.getValue();
    this.fromDate = dates.from;
    this.toDate = dates.to;
    this.applyDateFilter(true); // Pass true to preserve the preset
  }

  private getLast12Months(): { from: string, to: string } {
    const today = new Date();
    const lastYear = new Date(today);
    lastYear.setFullYear(today.getFullYear() - 1);

    return {
      from: lastYear.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    };
  }

  private getCurrentYear(): { from: string, to: string } {
    const year = new Date().getFullYear();
    return {
      from: `${year}-01-01`,
      to: `${year}-12-31`
    };
  }

  private getLast2Years(): { from: string, to: string } {
    const today = new Date();
    const twoYearsAgo = new Date(today);
    twoYearsAgo.setFullYear(today.getFullYear() - 2);

    return {
      from: twoYearsAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    };
  }

  private formatMonthLabel(period: string | number | undefined): string {
    if (!period) return '';

    const periodStr = typeof period === 'string' ? period : String(period);

    if (periodStr.includes('-')) {
      const parts = periodStr.split('-');
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;

        if (!isNaN(year) && !isNaN(month)) {
          const date = new Date(year, month);
          return new Intl.DateTimeFormat('en-US', {
            year: '2-digit',
            month: 'short'
          }).format(date);
        }
      }
    }
    return periodStr;
  }

  private getMonthName(month: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  }

  private transparentize(color: string, opacity: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * Calculate growth rate dynamically between first and last period
   * @param data The revenue timeline data
   * @returns Growth rate as a percentage
   */
  calculateGrowthRate(data: RevenueTimelineData): number {
    if (!data.revenue_by_period || data.revenue_by_period.length < 2) {
      return 0;
    }

    const firstPeriod = data.revenue_by_period[0];
    const lastPeriod = data.revenue_by_period[data.revenue_by_period.length - 1];

    if (firstPeriod.amount === 0) return 0;

    return ((lastPeriod.amount - firstPeriod.amount) / firstPeriod.amount) * 100;
  }
}
