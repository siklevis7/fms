import os
import re

dir_path = r"c:\Users\FH\Documents\fams\frontend\src\components"

replacements = {
    r'\bbg-white\b(?! dark:bg-slate-800)': 'bg-white dark:bg-slate-800',
    r'\btext-slate-800\b(?! dark:text-white)': 'text-slate-800 dark:text-white',
    r'\btext-slate-900\b(?! dark:text-white)': 'text-slate-900 dark:text-white',
    r'\bborder-slate-200\b(?! dark:border-slate-700)': 'border-slate-200 dark:border-slate-700',
    r'\bbg-slate-50\b(?! dark:bg-slate-900)': 'bg-slate-50 dark:bg-slate-900',
    r'\bbg-slate-100\b(?! dark:bg-slate-800)': 'bg-slate-100 dark:bg-slate-800',
    r'\btext-slate-500\b(?! dark:text-slate-400)': 'text-slate-500 dark:text-slate-400',
    r'\btext-slate-600\b(?! dark:text-slate-300)': 'text-slate-600 dark:text-slate-300',
    r'\btext-slate-700\b(?! dark:text-slate-200)': 'text-slate-700 dark:text-slate-200',
    r'\bborder-slate-300\b(?! dark:border-slate-600)': 'border-slate-300 dark:border-slate-600',
    r'\btext-blue-600\b(?! dark:text-blue-400)': 'text-blue-600 dark:text-blue-400',
    r'\bbg-blue-50\b(?! dark:bg-blue-900/20)': 'bg-blue-50 dark:bg-blue-900/20',
    r'\bborder-blue-200\b(?! dark:border-blue-800)': 'border-blue-200 dark:border-blue-800',
    r'\btext-emerald-700\b(?! dark:text-emerald-400)': 'text-emerald-700 dark:text-emerald-400',
    r'\btext-amber-700\b(?! dark:text-amber-400)': 'text-amber-700 dark:text-amber-400',
    r'\btext-rose-700\b(?! dark:text-rose-400)': 'text-rose-700 dark:text-rose-400',
    r'\bbg-emerald-50\b(?! dark:bg-emerald-900/20)': 'bg-emerald-50 dark:bg-emerald-900/20',
    r'\bbg-amber-50\b(?! dark:bg-amber-900/20)': 'bg-amber-50 dark:bg-amber-900/20',
    r'\bbg-rose-50\b(?! dark:bg-rose-900/20)': 'bg-rose-50 dark:bg-rose-900/20',
    r'\bbg-slate-800\b(?! dark:bg-slate-700)': 'bg-slate-800 dark:bg-slate-700',
}

for root, _, files in os.walk(dir_path):
    for f in files:
        if f.endswith('.jsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            for pattern, repl in replacements.items():
                content = re.sub(pattern, repl, content)
            
            with open(path, 'w', encoding='utf-8') as file:
                file.write(content)
print("Updated all files!")
