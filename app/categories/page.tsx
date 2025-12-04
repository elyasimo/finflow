// @ts-nocheck
"use client";

import { useState } from 'react';
import { useCategories } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Layout from "@/components/finflow/layout";
import MobileCategoriesNew from "@/components/finflow/mobile-categories-new";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getTranslatedText } from '@/lib/translation-utils';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
import { useMediaQuery } from '@/hooks/use-mobile';

export default function CategoriesPage() {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory } =
    useCategories();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editCategoryName, setEditCategoryName] = useState('');

  const handleCreateCategory = async () => {
    try {
      await createCategory.mutateAsync({ name: newCategoryName });
      setNewCategoryName('');
      setIsCreateDialogOpen(false);
    } catch (error) {
      alert(`Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;
    try {
      await updateCategory.mutateAsync({
        id: selectedCategory.id,
        data: { name: editCategoryName },
      });
      setSelectedCategory(null);
      setEditCategoryName('');
      setIsEditDialogOpen(false);
    } catch (error) {
      alert(`Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
    } catch (error) {
      alert(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEditClick = (category: { id: string; name: string }) => {
    setSelectedCategory(category);
    setEditCategoryName(category.name);
    setIsEditDialogOpen(true);
  };

  // Render mobile version
  if (isMobile) {
    return (
      <MobileCategoriesNew
        categories={categories.map(c => ({
          id: c.id,
          name: getTranslatedText(c.name, c.nameTranslations, language),
          icon: c.icon,
        }))}
        onAddCategory={() => setIsCreateDialogOpen(true)}
        onEditCategory={(id) => {
          const category = categories.find(c => c.id === id);
          if (category) {
            handleEditClick(category);
          }
        }}
        onDeleteCategory={(id) => handleDeleteCategory(id)}
      />
    );
  }

  return (
    <Layout user={user}>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t('categories')}</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)} disabled={createCategory.isPending}>
            {createCategory.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('creating')}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {t('addCategory')}
              </>
            )}
          </Button>
        </div>

        {/* Create Category Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('newCategory')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Input
                  id="name"
                  placeholder={t('categoryName')}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsCreateDialogOpen(false)} variant="outline">
                {t('cancel')}
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={createCategory.isPending || !newCategoryName.trim()}
              >
                {createCategory.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('creating')}
                  </>
                ) : (
                  t('create')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('editCategory')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Input
                  id="name"
                  placeholder={t('categoryName')}
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsEditDialogOpen(false)} variant="outline">
                {t('cancel')}
              </Button>
              <Button
                onClick={handleUpdateCategory}
                disabled={updateCategory.isPending || !editCategoryName.trim()}
              >
                {updateCategory.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('updating')}
                  </>
                ) : (
                  t('update')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Categories List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {category.icon && (
                      <div className="flex-shrink-0">
                        <CategoryIcon iconName={category.icon} />
                      </div>
                    )}
                    <span className="text-lg font-medium">
                      {getTranslatedText(category.name, category.nameTranslations, language)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(category)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      {t('edit')}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-500">
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('delete')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('deleteCategory')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('confirmDeleteCategory')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCategory(category.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            {t('delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 