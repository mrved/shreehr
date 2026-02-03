import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

// Shared styles
export const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 8,
    color: '#6B7280',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
    color: '#1F2937',
  },
  periodText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#4B5563',
    marginBottom: 15,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: '#F3F4F6',
    padding: 5,
    marginBottom: 5,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 3,
    paddingHorizontal: 5,
  },
  labelColumn: {
    width: '60%',
  },
  valueColumn: {
    width: '40%',
    textAlign: 'right',
  },
  label: {
    color: '#4B5563',
  },
  value: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 5,
    backgroundColor: '#EFF6FF',
    borderTopWidth: 1,
    borderTopColor: '#2563EB',
    marginTop: 5,
  },
  totalLabel: {
    width: '60%',
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  totalValue: {
    width: '40%',
    textAlign: 'right',
    fontWeight: 'bold',
    color: '#1E40AF',
    fontSize: 11,
  },
  netPaySection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
  },
  netPayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  netPayLabel: {
    width: '40%',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  netPayValue: {
    width: '60%',
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  netPayWords: {
    marginTop: 5,
    fontSize: 8,
    color: '#3B82F6',
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    fontSize: 8,
    color: '#9CA3AF',
  },
  twoColumn: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  column: {
    width: '50%',
    paddingRight: 10,
  },
});

// Reusable components
export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={pdfStyles.row}>
      <Text style={[pdfStyles.labelColumn, pdfStyles.label]}>{label}</Text>
      <Text style={[pdfStyles.valueColumn, pdfStyles.value]}>{value}</Text>
    </View>
  );
}

export function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={pdfStyles.totalRow}>
      <Text style={pdfStyles.totalLabel}>{label}</Text>
      <Text style={pdfStyles.totalValue}>{value}</Text>
    </View>
  );
}

export function SectionTitle({ title }: { title: string }) {
  return <Text style={pdfStyles.sectionTitle}>{title}</Text>;
}
