import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { z } from "zod";

export const campgroundRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return await ctx.prisma.camp.findUnique({
        where: {
          id: input.id,
        },
        include: { reviews: true },
      });
     
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.camp.findMany({
      take: 15,
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });
  }),
  testAll: publicProcedure
    .input(
      z.object({
        cursor: z.number().min(0).default(0), // <-- "cursor" needs to exist, but can be any type
        skip: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const limit = 3; 
      const { cursor } = input;

      const camp = await ctx.prisma.camp.findMany({
        take: limit,

        skip: limit * cursor,
      });

      return {
        camp,
      };
    }),
  addCamp: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        address: z.string(),
        price: z.number(),
        image: z.string(),
        review: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.camp.create({
        data: {
          name: input.name,
          address: input.address,
          price: input.price,
          review: input.review,
          image: input.image,
          authorId: ctx.session.user.id,
          authorName: ctx.session.user.name!,
        },
      });
    }),
  deleteCamp: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const camp = await ctx.prisma.camp.findUnique({
        where: {
          id: input.id,
        },
      });
      if (camp?.authorId === ctx.session.user.id) {
        await ctx.prisma.camp.delete({
          where: {
            id: input.id,
          },
        });
      }
    }),
  updateCamp: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        address: z.string(),
        price: z.number(),
        image: z.string(),
        review: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const camp = await ctx.prisma.camp.findUnique({
        where: {
          id: input.id,
        },
      });
      if (camp?.authorId === ctx.session.user.id) {
        await ctx.prisma.camp.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.name,
            address: input.address,
            price: input.price,
            review: input.review,
            image: input.image,
          },
        });
      }
    }),
  insertReview: protectedProcedure
    .input(
      z.object({
        campId: z.string(),
        comment: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.reviews.create({
        data: {
          comment: input.comment,
          userId: ctx.session.user.id,
          username: ctx.session.user.name as string,
          camp: { connect: { id: input.campId } },
        },
      });
    }),
  deleteReview: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const review = await ctx.prisma.reviews.findUnique({
        where: {
          id: input.reviewId,
        },
      });
      if (review?.userId === ctx.session.user.id) {
        await ctx.prisma.reviews.delete({
          where: {
            id: input.reviewId,
          },
        });
      }
    }),
});
